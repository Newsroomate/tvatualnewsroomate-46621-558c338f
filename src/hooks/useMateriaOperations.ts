
import { useState } from "react";
import { Materia, Telejornal } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { createMateria, deleteMateria, updateMateria } from "@/services/api";
import { BlockWithItems } from "./useRealtimeMaterias/utils";

export const useMateriaOperations = (
  setBlocks?: React.Dispatch<React.SetStateAction<BlockWithItems[]>>,
  currentTelejornal?: Telejornal | null,
  setMateriaToDelete?: React.Dispatch<React.SetStateAction<Materia | null>>,
  setDeleteConfirmOpen?: React.Dispatch<React.SetStateAction<boolean>>,
  setNewItemBlock?: React.Dispatch<React.SetStateAction<string | null>>
) => {
  // Initialize state if not provided externally
  const [newItemBlockInternal, setNewItemBlockInternal] = useState<string | null>(null);
  const [materiaToDeleteInternal, setMateriaToDeleteInternal] = useState<Materia | null>(null);
  const [deleteConfirmOpenInternal, setDeleteConfirmOpenInternal] = useState(false);
  
  // Use provided state setters or internal ones
  const newItemBlock = newItemBlockInternal;
  const setNewItemBlockState = setNewItemBlock || setNewItemBlockInternal;
  const materiaToDelete = materiaToDeleteInternal;
  const setMateriaToDeleteState = setMateriaToDelete || setMateriaToDeleteInternal;
  const deleteConfirmOpen = deleteConfirmOpenInternal;
  const setDeleteConfirmOpenState = setDeleteConfirmOpen || setDeleteConfirmOpenInternal;
  
  const { toast } = useToast();

  // Find the highest page number across all blocks
  const findHighestPageNumber = (blocks: BlockWithItems[]): number => {
    let highestPage = 0;
    blocks.forEach(block => {
      block.items.forEach(item => {
        const pageNum = parseInt(item.pagina || '0');
        if (!isNaN(pageNum) && pageNum > highestPage) {
          highestPage = pageNum;
        }
      });
    });
    return highestPage;
  };

  const handleAddItem = async (blocoId: string, blocks: BlockWithItems[]) => {
    // Can't add items if espelho is not open
    if (!currentTelejornal?.espelho_aberto) {
      toast({
        title: "Espelho fechado",
        description: "Você precisa abrir o espelho para adicionar matérias.",
        variant: "destructive"
      });
      return;
    }
    
    setNewItemBlockState(blocoId);
    
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
      
      // Update UI if setBlocks is provided
      if (setBlocks) {
        setBlocks(prevBlocks => prevBlocks.map(block => {
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
      }
      
      setNewItemBlockState(null);
    } catch (error) {
      console.error("Erro ao adicionar matéria:", error);
      setNewItemBlockState(null);
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
    
    setMateriaToDeleteState(item);
    setDeleteConfirmOpenState(true);
  };

  const confirmDeleteMateria = async (blocks: BlockWithItems[]) => {
    if (!materiaToDelete) return;
    
    try {
      await deleteMateria(materiaToDelete.id);
      
      // Update UI if setBlocks is provided
      if (setBlocks) {
        setBlocks(prevBlocks => prevBlocks.map(block => {
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
      }
      
      setDeleteConfirmOpenState(false);
      setMateriaToDeleteState(null);
    } catch (error) {
      console.error("Erro ao excluir matéria:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a matéria",
        variant: "destructive"
      });
    }
  };

  const handleDragEnd = async (result: any, blocks: BlockWithItems[]) => {
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
    
    // Update the state if setBlocks is provided
    if (setBlocks) {
      setBlocks(updatedBlocks);
    }
    
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

  const handleRenumberItems = async (blocks: BlockWithItems[]) => {
    // Can't renumber if espelho is not open
    if (!currentTelejornal?.espelho_aberto) {
      toast({
        title: "Espelho fechado",
        description: "Você precisa abrir o espelho para reorganizar a numeração.",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  const confirmRenumberItems = async (blocks: BlockWithItems[], setRenumberConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>) => {
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
      
      // Update blocks state to trigger re-render if setBlocks is provided
      if (setBlocks) {
        setBlocks([...blocks]);
      }
      
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

  return {
    newItemBlock,
    setNewItemBlock: setNewItemBlockState,
    materiaToDelete,
    setMateriaToDelete: setMateriaToDeleteState,
    deleteConfirmOpen,
    setDeleteConfirmOpen: setDeleteConfirmOpenState,
    handleAddItem,
    handleDeleteMateria,
    confirmDeleteMateria,
    handleDragEnd,
    handleRenumberItems,
    confirmRenumberItems
  };
};
