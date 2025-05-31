
import { Bloco, Materia } from "@/types";
import { calculateBlockTotalTime } from "@/components/news-schedule/utils";

export const createUpdatedBlocks = (
  blocks: (Bloco & { items: Materia[], totalTime: number })[],
  sourceBlockId: string,
  destBlockId: string,
  sourceIndex: number,
  destinationIndex: number,
  movedItem: Materia
): (Bloco & { items: Materia[], totalTime: number })[] => {
  return blocks.map(block => {
    // Handle source block
    if (block.id === sourceBlockId) {
      const newItems = [...block.items];
      newItems.splice(sourceIndex, 1);
      
      // If moving within the same block, we need to update all items' ordem
      if (sourceBlockId === destBlockId) {
        // Re-insert the item at the destination index
        newItems.splice(destinationIndex, 0, {
          ...movedItem,
          bloco_id: destBlockId,
        });
        
        // Update ordem for all items in the block
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          ordem: index + 1
        }));
        
        return {
          ...block,
          items: updatedItems,
          totalTime: calculateBlockTotalTime(updatedItems)
        };
      }
      
      // If moved to a different block, just remove from source
      return {
        ...block,
        items: newItems.map((item, index) => ({
          ...item,
          ordem: index + 1
        })),
        totalTime: calculateBlockTotalTime(newItems)
      };
    }
    
    // Handle destination block (if different from source)
    if (block.id === destBlockId && sourceBlockId !== destBlockId) {
      const newItems = [...block.items];
      
      // Insert the moved item at the destination index
      newItems.splice(destinationIndex, 0, {
        ...movedItem,
        bloco_id: destBlockId,
      });
      
      // Update ordem for all items in the destination block
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        ordem: index + 1
      }));
      
      return {
        ...block,
        items: updatedItems,
        totalTime: calculateBlockTotalTime(updatedItems)
      };
    }
    
    return block;
  });
};

export const collectItemsForUpdate = (
  updatedBlocks: (Bloco & { items: Materia[], totalTime: number })[],
  sourceBlockId: string,
  destBlockId: string
): Partial<Materia>[] => {
  const itemsToUpdate: Partial<Materia>[] = [];
  
  // If same block, update all items in that block
  if (sourceBlockId === destBlockId) {
    const updatedBlock = updatedBlocks.find(b => b.id === sourceBlockId);
    if (updatedBlock) {
      itemsToUpdate.push(...updatedBlock.items.map(item => ({
        id: item.id,
        bloco_id: item.bloco_id,
        ordem: item.ordem,
        retranca: item.retranca
      })));
    }
  } else {
    // If different blocks, update items in both blocks
    const updatedSourceBlock = updatedBlocks.find(b => b.id === sourceBlockId);
    const updatedDestBlock = updatedBlocks.find(b => b.id === destBlockId);
    
    if (updatedSourceBlock) {
      itemsToUpdate.push(...updatedSourceBlock.items.map(item => ({
        id: item.id,
        bloco_id: item.bloco_id,
        ordem: item.ordem,
        retranca: item.retranca
      })));
    }
    
    if (updatedDestBlock) {
      itemsToUpdate.push(...updatedDestBlock.items.map(item => ({
        id: item.id,
        bloco_id: item.bloco_id,
        ordem: item.ordem,
        retranca: item.retranca
      })));
    }
  }
  
  return itemsToUpdate;
};
