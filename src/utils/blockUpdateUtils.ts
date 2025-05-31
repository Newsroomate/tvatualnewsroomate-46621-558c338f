
import { Bloco, Materia } from "@/types";
import { calculateBlockTotalTime } from "@/components/news-schedule/utils";

export const updateSourceBlocks = (
  sourceBlocks: (Bloco & { items: Materia[], totalTime: number })[],
  sourceBlockId: string,
  sourceIndex: number
): (Bloco & { items: Materia[], totalTime: number })[] => {
  return sourceBlocks.map(block => {
    if (block.id === sourceBlockId) {
      const newItems = [...block.items];
      newItems.splice(sourceIndex, 1);
      
      // Update ordem for remaining items
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

export const updateDestinationBlocks = (
  destBlocks: (Bloco & { items: Materia[], totalTime: number })[],
  destBlockId: string,
  destinationIndex: number,
  movedItem: Materia,
  nextPageNumber: string
): (Bloco & { items: Materia[], totalTime: number })[] => {
  return destBlocks.map(block => {
    if (block.id === destBlockId) {
      const newItems = [...block.items];
      
      // Insert the moved item at the destination index with updated properties
      newItems.splice(destinationIndex, 0, {
        ...movedItem,
        bloco_id: destBlockId,
        pagina: nextPageNumber
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

export const collectItemsToUpdate = (
  sourceJournal: string,
  destJournal: string,
  sourceBlockId: string,
  destBlockId: string,
  updatedSourceBlocks: (Bloco & { items: Materia[], totalTime: number })[],
  updatedDestBlocks: (Bloco & { items: Materia[], totalTime: number })[]
): Partial<Materia>[] => {
  const itemsToUpdate: Partial<Materia>[] = [];
  
  // Add source block items (if different from destination)
  if (sourceJournal !== destJournal || sourceBlockId !== destBlockId) {
    const updatedSourceBlock = updatedSourceBlocks.find(b => b.id === sourceBlockId);
    if (updatedSourceBlock) {
      itemsToUpdate.push(...updatedSourceBlock.items.map(item => ({
        id: item.id,
        bloco_id: item.bloco_id,
        ordem: item.ordem,
        retranca: item.retranca,
        pagina: item.pagina
      })));
    }
  }
  
  // Add destination block items
  const updatedDestBlock = updatedDestBlocks.find(b => b.id === destBlockId);
  if (updatedDestBlock) {
    itemsToUpdate.push(...updatedDestBlock.items.map(item => ({
      id: item.id,
      bloco_id: item.bloco_id,
      ordem: item.ordem,
      retranca: item.retranca,
      pagina: item.pagina
    })));
  }
  
  return itemsToUpdate;
};
