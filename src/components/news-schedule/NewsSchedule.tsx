
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  fetchBlocosByTelejornal, 
  fetchMateriasByBloco, 
  createBloco, 
  createMateria, 
  deleteMateria,
  updateMateria,
  renameBloco,
  deleteBloco
} from "@/services/api";
import { Bloco, Materia, Telejornal } from "@/types";
import { fetchTelejornais } from "@/services/api";
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
import { useToast } from "@/hooks/use-toast";
import { ScheduleHeader } from "./ScheduleHeader";
import { ScheduleContent } from "./ScheduleContent";
import { findHighestPageNumber, calculateBlockTotalTime } from "./utils";
import { Teleprompter } from "../teleprompter/Teleprompter";
import { useAuth } from "@/context/AuthContext";
import { useRealtimeMaterias } from "@/hooks/useRealtimeMaterias";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, ArrowDownUp, Lock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface NewsScheduleProps {
  selectedJournal: string | null;
  onEditItem: (item: Materia) => void;
  currentTelejornal: Telejornal | null;
  onOpenRundown: () => void;
}

export const NewsSchedule = ({ 
  selectedJournal, 
  onEditItem, 
  currentTelejornal, 
  onOpenRundown 
}: NewsScheduleProps) => {
  const [totalJournalTime, setTotalJournalTime] = useState(0);
  const [newItemBlock, setNewItemBlock] = useState<string | null>(null);
  const [telejornais, setTelejornais] = useState<Telejornal[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [materiaToDelete, setMateriaToDelete] = useState<Materia | null>(null);
  const [renumberConfirmOpen, setRenumberConfirmOpen] = useState(false);
  const [isCreatingFirstBlock, setIsCreatingFirstBlock] = useState(false);
  const [blockCreationAttempted, setBlockCreationAttempted] = useState(false);
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();
  
  // Track if a block creation is in progress to prevent multiple attempts
  const blockCreationInProgress = useRef(false);

  // Use our enhanced custom hook for realtime updates
  const { blocks, setBlocks, startDragging, endDragging, trackDragOperation } = useRealtimeMaterias({
    selectedJournal,
    newItemBlock,
    materiaToDelete
  });

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
  }, [blocosQuery.data, selectedJournal, setBlocks]);

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
      const nextPage = (findHighestPageNumber(blocks) + 1).toString();
      
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

  // Update the handleDragEnd function to improve sync between local and realtime updates
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
    
    // Get the item being moved
    const movedItem = {...sourceBlock.items[source.index]};
    
    // Log detailed information about the move
    console.log(`Moving item ${movedItem.id} from block ${sourceBlockId} (index ${source.index}) to block ${destBlockId} (index ${destination.index})`);
    console.log('Item being moved:', movedItem);
    
    // Update blocks array for optimistic UI update
    const updatedBlocks = blocks.map(block => ({
      ...block,
      items: [...block.items]
    }));
    
    // Find the source and destination blocks in our cloned array
    const updatedSourceBlock = updatedBlocks.find(b => b.id === sourceBlockId);
    const updatedDestBlock = updatedBlocks.find(b => b.id === destBlockId);
    
    if (!updatedSourceBlock || !updatedDestBlock) return;
    
    // Remove item from source block
    const [removedItem] = updatedSourceBlock.items.splice(source.index, 1);
    
    // If moving to a different block, update the bloco_id
    if (sourceBlockId !== destBlockId) {
      removedItem.bloco_id = destBlockId;
    }
    
    // Update the ordem to match the destination index
    removedItem.ordem = destination.index + 1;
    
    // Insert item at destination position
    updatedDestBlock.items.splice(destination.index, 0, removedItem);
    
    // Recalculate total times
    updatedSourceBlock.totalTime = calculateBlockTotalTime(updatedSourceBlock.items);
    updatedDestBlock.totalTime = calculateBlockTotalTime(updatedDestBlock.items);
    
    // Update the state immediately for responsive UI
    setBlocks(updatedBlocks);
    
    // Update in the database
    try {
      // Only include the fields that are expected by the API
      const updatePayload = {
        bloco_id: destBlockId,
        ordem: destination.index + 1,
        // Include only fields needed by the database
        retranca: movedItem.retranca,
        clip: movedItem.clip || "",
        status: movedItem.status || "draft",
        reporter: movedItem.reporter || "",
        duracao: movedItem.duracao,
        pagina: movedItem.pagina || "",
        texto: movedItem.texto || "",
        cabeca: movedItem.cabeca || ""
      };
      
      // Log what we're about to update
      console.log(`Updating item ${movedItem.id} in database with:`, updatePayload);
      
      await updateMateria(movedItem.id, updatePayload);
      console.log("Database update complete");
      
      // Show success toast
      toast({
        title: "Matéria movida",
        description: "A posição da matéria foi atualizada com sucesso.",
      });
    } catch (error) {
      console.error("Error updating item position:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao reordenar as matérias",
        variant: "destructive"
      });
      
      // If there was an error, revert to original state - but with a delay
      // to avoid conflict with optimistic updates
      setTimeout(() => {
        blocosQuery.refetch();
      }, 500);
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

  const handleRenameBlock = async (blockId: string, newName: string) => {
    if (!currentTelejornal?.espelho_aberto) {
      toast({
        title: "Espelho fechado",
        description: "Você precisa abrir o espelho para renomear blocos.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const updatedBlock = await renameBloco(blockId, newName);
      
      // Update blocks state
      setBlocks(blocks.map(block => 
        block.id === blockId 
          ? { ...block, nome: newName } 
          : block
      ));
      
    } catch (error) {
      console.error("Erro ao renomear bloco:", error);
      toast({
        title: "Erro",
        description: "Não foi possível renomear o bloco",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteBlock = async (blockId: string) => {
    if (!currentTelejornal?.espelho_aberto) {
      toast({
        title: "Espelho fechado",
        description: "Você precisa abrir o espelho para excluir blocos.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await deleteBloco(blockId);
      
      // Update blocks state - remove the deleted block
      setBlocks(blocks.filter(block => block.id !== blockId));
      
    } catch (error) {
      console.error("Erro ao excluir bloco:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o bloco",
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

  const handleTeleprompter = (shouldOpen: boolean) => {
    if (shouldOpen && blocks.length === 0) {
      toast({
        title: "Sem blocos",
        description: "Não há blocos para exibir no teleprompter.",
        variant: "destructive"
      });
      return;
    }
    
    setShowTeleprompter(shouldOpen);
    
    if (shouldOpen) {
      toast({
        title: "✅ Espelho carregado",
        description: "Espelho carregado no modo Teleprompter com sucesso.",
        variant: "default"
      });
    }
  };

  const isLoading = telejornaisQuery?.isLoading || blocosQuery?.isLoading;

  return (
    <div className="flex flex-col h-full">
      {/* Header with journal info and total time */}
      <ScheduleHeader
        currentTelejornal={currentTelejornal}
        totalJournalTime={totalJournalTime}
        onRenumberItems={handleRenumberItems}
        hasBlocks={blocks.length > 0}
        blocksWithItems={blocks}
        onOpenTeleprompter={handleTeleprompter}
      />

      {/* Main area with blocks */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <ScheduleContent
          selectedJournal={selectedJournal}
          currentTelejornal={currentTelejornal}
          blocks={blocks}
          isLoading={isLoading}
          isCreatingFirstBlock={isCreatingFirstBlock}
          newItemBlock={newItemBlock}
          onOpenRundown={onOpenRundown}
          onAddFirstBlock={handleAddFirstBlock}
          onAddBlock={handleAddBlock}
          onAddItem={handleAddItem}
          onEditItem={onEditItem}
          onDeleteItem={handleDeleteMateria}
          onRenameBlock={handleRenameBlock}
          onDeleteBlock={handleDeleteBlock}
          onDragEnd={handleDragEnd}
          startDragging={startDragging}
          endDragging={endDragging}
          trackDragOperation={trackDragOperation}
        />
      </div>

      {/* Teleprompter view (conditionally rendered) */}
      {showTeleprompter && (
        <Teleprompter 
          blocks={blocks}
          onClose={() => setShowTeleprompter(false)}
        />
      )}

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
