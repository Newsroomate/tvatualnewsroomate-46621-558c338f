
import { Bloco, Materia } from "@/types";
import { calculateBlockTotalTime } from "@/components/news-schedule/utils";

type BlockWithItems = Bloco & { items: Materia[], totalTime: number };

export const useDragAndDropOperations = () => {
  const updateBlocksForSameBlock = (
    blocks: BlockWithItems[],
    sourceBlockId: string,
    sourceIndex: number,
    destinationIndex: number
  ): BlockWithItems[] => {
    return blocks.map(block => {
      if (block.id === sourceBlockId) {
        const newItems = [...block.items];
        const movedItem = newItems.splice(sourceIndex, 1)[0];
        newItems.splice(destinationIndex, 0, movedItem);
        
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
      return block;
    });
  };

  const updateBlocksForDifferentBlocks = (
    blocks: BlockWithItems[],
    sourceBlockId: string,
    destBlockId: string,
    sourceIndex: number,
    destinationIndex: number
  ): BlockWithItems[] => {
    const sourceBlock = blocks.find(b => b.id === sourceBlockId);
    if (!sourceBlock) return blocks;
    
    const movedItem = { ...sourceBlock.items[sourceIndex] };
    
    return blocks.map(block => {
      // Handle source block
      if (block.id === sourceBlockId) {
        const newItems = [...block.items];
        newItems.splice(sourceIndex, 1);
        
        return {
          ...block,
          items: newItems.map((item, index) => ({
            ...item,
            ordem: index + 1
          })),
          totalTime: calculateBlockTotalTime(newItems)
        };
      }
      
      // Handle destination block
      if (block.id === destBlockId) {
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

  const prepareItemsForUpdate = (
    updatedBlocks: BlockWithItems[],
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

  return {
    updateBlocksForSameBlock,
    updateBlocksForDifferentBlocks,
    prepareItemsForUpdate
  };
};
