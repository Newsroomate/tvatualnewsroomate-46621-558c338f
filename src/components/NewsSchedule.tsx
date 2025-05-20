import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, ArrowDownUp, Lock } from "lucide-react";
import { 
  fetchBlocosByTelejornal, 
  fetchMateriasByBloco, 
  createBloco, 
  createMateria, 
  deleteMateria,
  updateMateria
} from "@/services/api";
import { Bloco, Materia, Telejornal } from "@/types";
import { fetchTelejornais } from "@/services/api";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NewsScheduleProps {
  selectedJournal: string | null;
  onEditItem: (item: Materia) => void;
  currentTelejornal: Telejornal | null;
  onOpenRundown: () => void;
}

export const NewsSchedule = ({ selectedJournal, onEditItem, currentTelejornal, onOpenRundown }: NewsScheduleProps) => {
  const [blocks, setBlocks] = useState<(Bloco & { items: Materia[], totalTime: number })[]>([]);
  const [totalJournalTime, setTotalJournalTime] = useState(0);
  const [newItemBlock, setNewItemBlock] = useState<string | null>(null);
  const [telejornais, setTelejornais] = useState<Telejornal[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [materiaToDelete, setMateriaToDelete] = useState<Materia | null>(null);
  const [renumberConfirmOpen, setRenumberConfirmOpen] = useState(false);
  const [isCreatingFirstBlock, setIsCreatingFirstBlock] = useState(false);
  const [blockCreationAttempted, setBlockCreationAttempted] = useState(false);
  const { toast } = useToast();
  
  // Track if a block creation is in progress to prevent multiple attempts
  const blockCreationInProgress = useRef(false);

  // Fetch telejornais
  const telejornaisQuery = useQuery({
    queryKey: ['telejornais'],
    queryFn: fetchTelejornais,
  });

  // Update state when telejornais data is fetched
  useEffect(() => {
    if (telejornaisQuery.data) {
      setTelejornais(telejornaisQuery.data);
    }
  }, [telejornaisQuery.data]);

  // Fetch blocks for the selected journal
  const blocosQuery = useQuery({
    queryKey: ['blocos', selectedJournal],
    queryFn: () => selectedJournal ? fetchBlocosByTelejornal(selectedJournal) : Promise.resolve([]),
    enabled: !!selectedJournal,
  });

  // Process blocks data when it changes
  useEffect(() => {
    if (!blocosQuery.data || !selectedJournal) return;
    
    const loadBlocos = async () => {
      try {
        const blocosComItems = await Promise.all(
          blocosQuery.data.map(async (bloco) => {
            const materias = await fetchMateriasByBloco(bloco.id);
            const totalTime = materias.reduce((sum, item) => sum + item.duracao, 0);
            return {
              ...bloco,
              items: materias,
              totalTime
            };
          })
        );
        
        setBlocks(blocosComItems);
        
        // Reset the flag since we've processed the data
        setBlockCreationAttempted(true);
      } catch (error) {
        console.error("Erro ao carregar blocos e matérias:", error);
      }
    };
    
    loadBlocos();
  }, [blocosQuery.data, selectedJournal]);

  // Handle auto-creation of first block, separated from the blocks data processing effect
  useEffect(() => {
    // Skip if no telejornal selected, espelho is not open, or we're already creating a block
    if (!selectedJournal || !currentTelejornal?.espelho_aberto || blockCreationInProgress.current || isCreatingFirstBlock) {
      return;
    }
    
    // Skip if we don't have the blocks data yet or if we've already checked
    if (!blocosQuery.data || !blockCreationAttempted) {
      return;
    }

    const createInitialBlock = async () => {
      // Only create a block if there are no blocks and we haven't already tried
      if (blocosQuery.data.length === 0 && !blockCreationInProgress.current) {
        setIsCreatingFirstBlock(true);
        blockCreationInProgress.current = true;
        
        console.log("Attempting to create initial block for telejornal:", selectedJournal);
        
        try {
          await handleAddFirstBlock();
        } catch (error) {
          console.error("Erro ao criar o bloco inicial:", error);
          // If the error is about a duplicate, we can ignore it - the block exists
          if (error instanceof Error && error.message.includes("duplicate key value")) {
            console.log("Block already exists, refreshing data...");
            // Force a refresh of blocks query
            blocosQuery.refetch();
          } else {
            toast({
              title: "Erro ao criar bloco inicial",
              description: "Ocorreu um erro ao criar o primeiro bloco. Por favor, tente novamente.",
              variant: "destructive"
            });
          }
        } finally {
          blockCreationInProgress.current = false;
          setIsCreatingFirstBlock(false);
        }
      }
    };
    
    createInitialBlock();
  }, [selectedJournal, currentTelejornal?.espelho_aberto, blocosQuery.data, blockCreationAttempted]);

  // Recalculate total journal time when blocks change
  useEffect(() => {
    const total = blocks.reduce((sum, block) => sum + block.totalTime, 0);
    setTotalJournalTime(total);
  }, [blocks]);

  // Find the highest page number across all blocks
  const findHighestPageNumber = (): number => {
    let highestPage = 0;
    blocks.forEach(block => {
      block.items.forEach(item => {
        const pageNum = parseInt(item.pagina);
        if (!isNaN(pageNum) && pageNum > highestPage) {
          highestPage = pageNum;
        }
      });
    });
    return highestPage;
  };

  // Function to handle adding the first block specifically
  const handleAddFirstBlock = async () => {
    if (!selectedJournal || !currentTelejornal?.espelho_aberto) {
      console.log("Cannot create first block - journal not selected or espelho not open");
      return;
    }
    
    try {
      // Double check to make sure we don't have blocks already
      const existingBlocks = await fetchBlocosByTelejornal(selectedJournal);
      
      console.log(`Checking for existing blocks for telejornal ${selectedJournal}:`, existingBlocks);
      
      // If blocks already exist, just return without creating a new one
      if (existingBlocks && existingBlocks.length > 0) {
        console.log("Blocks already exist for this journal, skipping creation");
        setBlocks(blocks => blocks.length ? blocks : existingBlocks.map(b => ({ ...b, items: [], totalTime: 0 })));
        return;
      }
      
      console.log("No existing blocks found, creating first block");
      
      // Create the new block
      const novoBlocoInput = {
        telejornal_id: selectedJournal,
        nome: "Bloco 1",
        ordem: 1
      };
      
      const novoBloco = await createBloco(novoBlocoInput);
      console.log("First block created successfully:", novoBloco);
      
      // Immediately update the UI
      setBlocks([{ 
        ...novoBloco, 
        items: [],
        totalTime: 0
      }]);
      
      // Force refresh the blocks query
      blocosQuery.refetch();
      
      return novoBloco;
    } catch (error) {
      console.error("Erro ao adicionar bloco inicial:", error);
      
      // If the error is a duplicate key error, we can try to fetch the blocks again
      if (error instanceof Error && error.message.includes("duplicate key value")) {
        console.log("Duplicate error detected, attempting to refetch blocks");
        blocosQuery.refetch();
      } else {
        // For other errors, show a toast
        toast({
          title: "Erro",
          description: "Não foi possível adicionar o bloco inicial",
          variant: "destructive"
        });
      }
      
      throw error;
    }
  };

  const handleAddBlock = async () => {
    if (!selectedJournal) return;
    
    // Can't add blocks if espelho is not open
    if (!currentTelejornal?.espelho_aberto) {
      toast({
        title: "Espelho fechado",
        description: "Você precisa abrir o espelho para adicionar blocos.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const nextOrder = blocks.length + 1;
      const novoBlocoInput = {
        telejornal_id: selectedJournal,
        nome: `Bloco ${nextOrder}`,
        ordem: nextOrder
      };
      
      const novoBloco = await createBloco(novoBlocoInput);
      console.log(`New block created: ${novoBloco.nome} with order ${novoBloco.ordem}`);
      
      // Update UI
      setBlocks([...blocks, { 
        ...novoBloco, 
        items: [],
        totalTime: 0
      }]);
    } catch (error) {
      console.error("Erro ao adicionar bloco:", error);
      
      // If it's a duplicate key error, try to use a different order number
      if (error instanceof Error && error.message.includes("duplicate key value")) {
        console.log("Duplicate block order detected, trying with a different order");
        
        try {
          // Find the highest order number and add 1
          const highestOrder = blocks.reduce((max, block) => 
            block.ordem > max ? block.ordem : max, 0);
          
          const novoBlocoInput = {
            telejornal_id: selectedJournal,
            nome: `Bloco ${highestOrder + 1}`,
            ordem: highestOrder + 1
          };
          
          const novoBloco = await createBloco(novoBlocoInput);
          console.log(`New block created with adjusted order: ${novoBloco.nome} with order ${novoBloco.ordem}`);
          
          // Update UI
          setBlocks([...blocks, { 
            ...novoBloco, 
            items: [],
            totalTime: 0
          }]);
          
          return;
        } catch (retryError) {
          console.error("Erro ao tentar criar bloco com ordem diferente:", retryError);
        }
      }
      
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o bloco",
        variant: "destructive"
      });
    }
  };

  const handleAddItem = async (blocoId: string) => {
    // Can't add items if espelho is not open
    if (!currentTelejornal?.espelho_aberto) {
      toast({
        title: "Espelho fechado",
        description: "Você precisa abrir o espelho para adicionar matérias.",
        variant: "destructive"
      });
      return;
    }
    
    setNewItemBlock(blocoId);
    
    try {
      const bloco = blocks.find(b => b.id === blocoId);
      if (!bloco) return;
      
      // Use the highest page number + 1 across all blocks
      const nextPage = (findHighestPageNumber() + 1).toString();
      
      const novaMateriaInput = {
        bloco_id: blocoId,
        pagina: nextPage,
        retranca: "Nova Matéria",
        clip: "",
        duracao: 0,
        status: "draft" as const,
        reporter: "",
        ordem: bloco.items.length + 1
      };
      
      const novaMateria = await createMateria(novaMateriaInput);
      
      // Update UI
      setBlocks(blocks.map(block => {
        if (block.id === blocoId) {
          const updatedItems = [...block.items, novaMateria];
          return {
            ...block,
            items: updatedItems,
            totalTime: updatedItems.reduce((sum, item) => sum + item.duracao, 0)
          };
        }
        return block;
      }));
      
      setNewItemBlock(null);
    } catch (error) {
      console.error("Erro ao adicionar matéria:", error);
      setNewItemBlock(null);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a matéria",
        variant: "destructive"
      });
    }
  };

  const handleDeleteMateria = (item: Materia) => {
    // Can't delete items if espelho is not open
    if (!currentTelejornal?.espelho_aberto) {
      toast({
        title: "Espelho fechado",
        description: "Você precisa abrir o espelho para excluir matérias.",
        variant: "destructive"
      });
      return;
    }
    
    setMateriaToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteMateria = async () => {
    if (!materiaToDelete) return;
    
    try {
      await deleteMateria(materiaToDelete.id);
      
      // Update UI after successful deletion
      setBlocks(blocks.map(block => {
        if (block.id === materiaToDelete.bloco_id) {
          const updatedItems = block.items.filter(item => item.id !== materiaToDelete.id);
          return {
            ...block,
            items: updatedItems,
            totalTime: updatedItems.reduce((sum, item) => sum + item.duracao, 0)
          };
        }
        return block;
      }));
      
      setDeleteConfirmOpen(false);
      setMateriaToDelete(null);
    } catch (error) {
      console.error("Erro ao excluir matéria:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a matéria",
        variant: "destructive"
      });
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!currentTelejornal?.espelho_aberto) {
      toast({
        title: "Espelho fechado",
        description: "Você precisa abrir o espelho para reordenar matérias.",
        variant: "destructive"
      });
      return;
    }
    
    const { source, destination } = result;
    
    // Dropped outside the list or no movement
    if (!destination || 
        (source.droppableId === destination.droppableId && 
         source.index === destination.index)) {
      return;
    }
    
    // Find source and destination blocks
    const sourceBlockId = source.droppableId;
    const destBlockId = destination.droppableId;
    
    const sourceBlock = blocks.find(b => b.id === sourceBlockId);
    const destBlock = blocks.find(b => b.id === destBlockId);
    
    if (!sourceBlock || !destBlock) return;
    
    // Clone current blocks state
    const newBlocks = [...blocks];
    
    // Get the item being moved
    const movedItem = {...sourceBlock.items[source.index]};
    
    // Update blocks array
    const updatedBlocks = newBlocks.map(block => {
      // Remove from source block
      if (block.id === sourceBlockId) {
        const newItems = [...block.items];
        newItems.splice(source.index, 1);
        
        return {
          ...block,
          items: newItems,
          totalTime: newItems.reduce((sum, item) => sum + item.duracao, 0)
        };
      }
      
      // Add to destination block
      if (block.id === destBlockId) {
        const newItems = [...block.items];
        
        // If moving to a different block, update the bloco_id
        if (sourceBlockId !== destBlockId) {
          movedItem.bloco_id = destBlockId;
        }
        
        newItems.splice(destination.index, 0, movedItem);
        
        return {
          ...block,
          items: newItems,
          totalTime: newItems.reduce((sum, item) => sum + item.duracao, 0)
        };
      }
      
      return block;
    });
    
    // Update the state
    setBlocks(updatedBlocks);
    
    // Update in the database
    try {
      // The item's ordem property should reflect its visual position
      const updatedItem = {
        ...movedItem,
        ordem: destination.index + 1,
        bloco_id: destBlockId
      };
      
      await updateMateria(movedItem.id, updatedItem);
    } catch (error) {
      console.error("Error updating item position:", error);
    }
  };

  const handleRenumberItems = async () => {
    // Can't renumber if espelho is not open
    if (!currentTelejornal?.espelho_aberto) {
      toast({
        title: "Espelho fechado",
        description: "Você precisa abrir o espelho para reorganizar a numeração.",
        variant: "destructive"
      });
      return;
    }
    
    setRenumberConfirmOpen(true);
  };

  const confirmRenumberItems = async () => {
    let pageNumber = 1;
    
    try {
      // Process blocks in order
      for (const block of blocks) {
        // Process items in each block
        for (let i = 0; i < block.items.length; i++) {
          const item = block.items[i];
          const updatedItem = {
            ...item,
            pagina: pageNumber.toString()
          };
          
          // Update in database
          await updateMateria(item.id, updatedItem);
          
          // Update local state
          block.items[i] = updatedItem;
          
          // Increment page number
          pageNumber++;
        }
      }
      
      // Update blocks state to trigger re-render
      setBlocks([...blocks]);
      setRenumberConfirmOpen(false);
      
      toast({
        title: "Numeração reorganizada",
        description: "A numeração das matérias foi reorganizada com sucesso.",
      });
    } catch (error) {
      console.error("Error renumbering items:", error);
      toast({
        title: "Erro",
        description: "Não foi possível reorganizar a numeração",
        variant: "destructive"
      });
    }
  };

  const handleItemDoubleClick = (item: Materia) => {
    onEditItem(item);
  };

  const handleEditButtonClick = (item: Materia) => {
    onEditItem(item);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Status color classes
  const getStatusClass = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isLoading = telejornaisQuery.isLoading || blocosQuery.isLoading;

  return (
    <div className="flex flex-col h-full">
      {/* Header with journal info and total time */}
      <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold">
            {currentTelejornal ? currentTelejornal.nome : "Selecione um Telejornal"}
          </h1>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={handleRenumberItems}
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-1"
                  disabled={!currentTelejornal?.espelho_aberto || blocks.length === 0}
                >
                  <ArrowDownUp className="h-4 w-4" />
                  Reorganizar Numeração
                </Button>
              </TooltipTrigger>
              {!currentTelejornal?.espelho_aberto && (
                <TooltipContent>
                  Abra o espelho para reorganizar a numeração
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <div className="text-right">
            <p className="text-sm font-medium">Tempo Total:</p>
            <p className="text-lg font-bold">{formatTime(totalJournalTime)}</p>
          </div>
        </div>
      </div>

      {/* Main area with blocks */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {!selectedJournal ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-gray-500">Selecione um telejornal no painel esquerdo</p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-gray-500">Carregando espelho...</p>
            </div>
          ) : !currentTelejornal?.espelho_aberto ? (
            <div className="flex flex-col items-center justify-center h-32 gap-3">
              <div className="flex items-center text-gray-500">
                <Lock className="h-5 w-5 mr-2" />
                <p>O espelho está fechado. Abra o espelho para adicionar e editar matérias.</p>
              </div>
              <Button onClick={onOpenRundown} variant="default">
                Abrir Espelho Agora
              </Button>
            </div>
          ) : blocks.length === 0 && isCreatingFirstBlock ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-gray-500">Criando bloco inicial...</p>
            </div>
          ) : blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-3">
              <p className="text-gray-500">Nenhum bloco encontrado</p>
              <Button onClick={handleAddFirstBlock} variant="default">
                Adicionar Bloco Inicial
              </Button>
            </div>
          ) : (
            blocks.map((block) => (
              <div key={block.id} className="border border-gray-200 rounded-lg shadow-sm">
                {/* Block header */}
                <div className="bg-muted p-3 rounded-t-lg flex justify-between items-center">
                  <h2 className="font-bold">{block.nome}</h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">
                      Tempo: {formatTime(block.totalTime)}
                    </span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleAddItem(block.id)}
                              disabled={newItemBlock === block.id || !currentTelejornal?.espelho_aberto}
                            >
                              <PlusCircle className="h-4 w-4 mr-1" /> Nova Matéria
                            </Button>
                          </div>
                        </TooltipTrigger>
                        {!currentTelejornal?.espelho_aberto && (
                          <TooltipContent>
                            Abra o espelho para adicionar matérias
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                {/* News item table */}
                <div className="overflow-x-auto">
                  <Droppable droppableId={block.id}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        <table className="w-full">
                          <thead className="bg-gray-50 text-xs uppercase">
                            <tr>
                              <th className="py-3 px-4 text-left">Página</th>
                              <th className="py-3 px-4 text-left">Retranca</th>
                              <th className="py-3 px-4 text-left">Clipe</th>
                              <th className="py-3 px-4 text-left">Duração</th>
                              <th className="py-3 px-4 text-left">Status</th>
                              <th className="py-3 px-4 text-left">Repórter</th>
                              <th className="py-3 px-4 text-left">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {block.items.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="py-4 text-center text-gray-500">
                                  Nenhuma matéria neste bloco
                                </td>
                              </tr>
                            ) : (
                              block.items.map((item, index) => (
                                <Draggable
                                  key={item.id}
                                  draggableId={item.id}
                                  index={index}
                                  isDragDisabled={!currentTelejornal?.espelho_aberto}
                                >
                                  {(provided, snapshot) => (
                                    <tr 
                                      key={item.id}
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`hover:bg-gray-50 transition-colors ${
                                        snapshot.isDragging ? "bg-blue-50" : ""
                                      }`}
                                      onDoubleClick={() => handleItemDoubleClick(item)}
                                    >
                                      <td className="py-2 px-4">{item.pagina}</td>
                                      <td className="py-2 px-4 font-medium">{item.retranca}</td>
                                      <td className="py-2 px-4 font-mono text-xs">{item.clip}</td>
                                      <td className="py-2 px-4">{formatTime(item.duracao)}</td>
                                      <td className="py-2 px-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(item.status)}`}>
                                          {item.status}
                                        </span>
                                      </td>
                                      <td className="py-2 px-4">{item.reporter || '-'}</td>
                                      <td className="py-2 px-4">
                                        <div className="flex gap-1">
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button 
                                                  size="sm" 
                                                  variant="ghost" 
                                                  onClick={() => handleEditButtonClick(item)}
                                                  disabled={!currentTelejornal?.espelho_aberto}
                                                >
                                                  Editar
                                                </Button>
                                              </TooltipTrigger>
                                              {!currentTelejornal?.espelho_aberto && (
                                                <TooltipContent>
                                                  Abra o espelho para editar
                                                </TooltipContent>
                                              )}
                                            </Tooltip>
                                          </TooltipProvider>
                                          
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button 
                                                  size="sm" 
                                                  variant="ghost" 
                                                  className="text-red-600 hover:text-red-800"
                                                  onClick={() => handleDeleteMateria(item)}
                                                  disabled={!currentTelejornal?.espelho_aberto}
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                              </TooltipTrigger>
                                              {!currentTelejornal?.espelho_aberto && (
                                                <TooltipContent>
                                                  Abra o espelho para excluir
                                                </TooltipContent>
                                              )}
                                            </Tooltip>
                                          </TooltipProvider>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </Draggable>
                              ))
                            )}
                            {provided.placeholder}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            ))
          )}

          {/* Button to add new block */}
          {selectedJournal && currentTelejornal?.espelho_aberto && blocks.length > 0 && (
            <div className="flex justify-center">
              <Button 
                variant="outline"
                onClick={handleAddBlock}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Adicionar Novo Bloco
              </Button>
            </div>
          )}
          
          {/* Button to add new block - disabled version with tooltip */}
          {selectedJournal && !currentTelejornal?.espelho_aberto && (
            <div className="flex justify-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button 
                        variant="outline"
                        disabled={true}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Adicionar Novo Bloco
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    Abra o espelho para adicionar blocos
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </DragDropContext>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta matéria? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDeleteMateria}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Renumber confirmation dialog */}
      <AlertDialog open={renumberConfirmOpen} onOpenChange={setRenumberConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reorganizar Numeração</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá renumerar todas as matérias sequencialmente com base na ordem atual. 
              Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRenumberItems}>
              Reorganizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
