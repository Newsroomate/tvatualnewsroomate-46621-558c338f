
import { Bloco, Materia } from "@/types";
import { calculateBlockTotalTime } from "@/components/news-schedule/utils";

export const updateSourceBlocks = (
  sourceBlocks: (Bloco & { items: Materia[], totalTime: number })[],
  sourceBlockId: string,
  sourceIndex: number
): (Bloco & { items: Materia[], totalTime: number })[] => {
  console.log(`Updating source blocks - removing item at index ${sourceIndex} from block ${sourceBlockId}`);
  
  return sourceBlocks.map(block => {
    if (block.id === sourceBlockId) {
      console.log(`Found source block "${block.nome}" with ${block.items.length} items`);
      const newItems = [...block.items];
      const removedItem = newItems.splice(sourceIndex, 1)[0];
      
      console.log(`Removed item "${removedItem?.retranca}" from source block`);
      
      // Update ordem for remaining items
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        ordem: index + 1
      }));
      
      console.log(`Source block now has ${updatedItems.length} items`);
      
      return {
        ...block,
        items: updatedItems,
        totalTime: calculateBlockTotalTime(updatedItems)
      };
    }
    return block;
  });
};

export const updateDestinationBlocks = (
  destBlocks: (Bloco & { items: Materia[], totalTime: number })[],
  destBlockId: string,
  destinationIndex: number,
  movedItem: Materia,
  nextPageNumber: string
): (Bloco & { items: Materia[], totalTime: number })[] => {
  console.log(`Updating destination blocks - adding item at index ${destinationIndex} to block ${destBlockId}`);
  console.log(`Item details:`, { 
    retranca: movedItem.retranca, 
    oldPage: movedItem.pagina, 
    newPage: nextPageNumber,
    oldBlockId: movedItem.bloco_id,
    newBlockId: destBlockId
  });
  
  return destBlocks.map(block => {
    if (block.id === destBlockId) {
      console.log(`Found destination block "${block.nome}" with ${block.items.length} items`);
      const newItems = [...block.items];
      
      // Insert the moved item at the destination index with updated properties
      const updatedMovedItem = {
        ...movedItem,
        bloco_id: destBlockId,
        pagina: nextPageNumber
      };
      
      newItems.splice(destinationIndex, 0, updatedMovedItem);
      console.log(`Added item "${updatedMovedItem.retranca}" to destination block at index ${destinationIndex}`);
      
      // Update ordem for all items in the destination block
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        ordem: index + 1
      }));
      
      console.log(`Destination block now has ${updatedItems.length} items`);
      
      return {
        ...block,
        items: updatedItems,
        totalTime: calculateBlockTotalTime(updatedItems)
      };
    }
    return block;
  });
};

export const collectItemsToUpdate = (
  sourceJournal: string,
  destJournal: string,
  sourceBlockId: string,
  destBlockId: string,
  updatedSourceBlocks: (Bloco & { items: Materia[], totalTime: number })[],
  updatedDestBlocks: (Bloco & { items: Materia[], totalTime: number })[]
): Partial<Materia>[] => {
  console.log('Collecting items to update in database');
  const itemsToUpdate: Partial<Materia>[] = [];
  
  // Add source block items (if different from destination)
  if (sourceJournal !== destJournal || sourceBlockId !== destBlockId) {
    const updatedSourceBlock = updatedSourceBlocks.find(b => b.id === sourceBlockId);
    if (updatedSourceBlock) {
      const sourceItems = updatedSourceBlock.items.map(item => ({
        id: item.id,
        bloco_id: item.bloco_id,
        ordem: item.ordem,
        retranca: item.retranca,
        pagina: item.pagina
      }));
      itemsToUpdate.push(...sourceItems);
      console.log(`Added ${sourceItems.length} items from source block`);
    }
  }
  
  // Add destination block items
  const updatedDestBlock = updatedDestBlocks.find(b => b.id === destBlockId);
  if (updatedDestBlock) {
    const destItems = updatedDestBlock.items.map(item => ({
      id: item.id,
      bloco_id: item.bloco_id,
      ordem: item.ordem,
      retranca: item.retranca,
      pagina: item.pagina
    }));
    itemsToUpdate.push(...destItems);
    console.log(`Added ${destItems.length} items from destination block`);
  }
  
  console.log(`Total items to update: ${itemsToUpdate.length}`);
  return itemsToUpdate;
};
