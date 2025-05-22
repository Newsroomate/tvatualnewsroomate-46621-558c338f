
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  createMateria, 
  deleteMateria,
  updateMateria
} from "@/services/api";
import { Bloco, Materia, Telejornal } from "@/types";
import { findHighestPageNumber, calculateBlockTotalTime } from "@/components/news-schedule/utils";

export const useMateriaOperations = (
  setBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[], totalTime: number })[]>>,
  currentTelejornal: Telejornal | null
) => {
  const [newItemBlock, setNewItemBlock] = useState<string | null>(null);
  const [materiaToDelete, setMateriaToDelete] = useState<Materia | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { toast } = useToast();

  const handleAddItem = async (
    blocoId: string, 
    blocks: (Bloco & { items: Materia[], totalTime: number })[]
  ) => {
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

  const confirmDeleteMateria = async (blocks: (Bloco & { items: Materia[], totalTime: number })[]) => {
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

  const handleDragEnd = async (
    result: any, 
    blocks: (Bloco & { items: Materia[], totalTime: number })[]
  ) => {
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
    
    // Log detailed information about the move
    console.log(`Moving item from block ${sourceBlockId} (index ${source.index}) to block ${destBlockId} (index ${destination.index})`);
    
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
        retranca: removedItem.retranca,
        clip: removedItem.clip || "",
        status: removedItem.status || "draft",
        reporter: removedItem.reporter || "",
        duracao: removedItem.duracao,
        pagina: removedItem.pagina || "",
        texto: removedItem.texto || "",
        cabeca: removedItem.cabeca || ""
      };
      
      // Log what we're about to update
      console.log(`Updating item ${removedItem.id} in database with:`, updatePayload);
      
      await updateMateria(removedItem.id, updatePayload);
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
    }
  };

  const handleRenumberItems = async (
    blocks: (Bloco & { items: Materia[], totalTime: number })[]
  ) => {
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

  const confirmRenumberItems = async (
    blocks: (Bloco & { items: Materia[], totalTime: number })[], 
    setRenumberConfirmOpen: (open: boolean) => void
  ) => {
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

  return {
    newItemBlock,
    setNewItemBlock,
    materiaToDelete,
    setMateriaToDelete,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    handleAddItem,
    handleDeleteMateria,
    confirmDeleteMateria,
    handleDragEnd,
    handleRenumberItems,
    confirmRenumberItems
  };
};
