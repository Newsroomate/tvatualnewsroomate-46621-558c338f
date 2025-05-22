
import { Telejornal } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { updateMateria } from "@/services/api";
import { BlockWithItems, logger } from "../useRealtimeMaterias/utils";

export const useDragOperations = (
  setBlocks?: React.Dispatch<React.SetStateAction<BlockWithItems[]>>,
  currentTelejornal?: Telejornal | null
) => {
  const { toast } = useToast();

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
      logger.error("Error updating item position:", error);
    }
  };

  return {
    handleDragEnd
  };
};
