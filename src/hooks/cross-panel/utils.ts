
import { BlockWithItems } from "./types";
import { Materia } from "@/types";
import { calculateBlockTotalTime, findHighestPageNumber } from "@/components/news-schedule/utils";

export const isPanelMovement = (
  sourceBlockId: string,
  destBlockId: string,
  primaryBlocks: BlockWithItems[],
  secondaryBlocks: BlockWithItems[]
): { sourceIsPrimary: boolean; destIsPrimary: boolean; isCrossPanel: boolean } => {
  const sourceIsPrimary = primaryBlocks.some(b => b.id === sourceBlockId);
  const destIsPrimary = primaryBlocks.some(b => b.id === destBlockId);
  const isCrossPanel = sourceIsPrimary !== destIsPrimary;
  
  return { sourceIsPrimary, destIsPrimary, isCrossPanel };
};

export const findBlocks = (
  sourceBlockId: string,
  destBlockId: string,
  sourceBlocks: BlockWithItems[],
  destBlocks: BlockWithItems[]
): { sourceBlock: BlockWithItems | undefined; destBlock: BlockWithItems | undefined } => {
  const sourceBlock = sourceBlocks.find(b => b.id === sourceBlockId);
  const destBlock = destBlocks.find(b => b.id === destBlockId);
  
  return { sourceBlock, destBlock };
};

export const updateSourceBlocks = (
  sourceBlocks: BlockWithItems[],
  sourceBlockId: string,
  sourceIndex: number
): BlockWithItems[] => {
  return sourceBlocks.map(block => {
    if (block.id === sourceBlockId) {
      const newItems = [...block.items];
      newItems.splice(sourceIndex, 1);
      
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
  destBlocks: BlockWithItems[],
  destBlockId: string,
  destinationIndex: number,
  movedItem: Materia,
  nextPageNumber: number
): BlockWithItems[] => {
  return destBlocks.map(block => {
    if (block.id === destBlockId) {
      const newItems = [...block.items];
      
      const updatedMovedItem = {
        ...movedItem,
        bloco_id: destBlockId,
        pagina: nextPageNumber.toString()
      };
      
      newItems.splice(destinationIndex, 0, updatedMovedItem);
      
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

export const prepareItemsToUpdate = (
  sourceBlockId: string,
  destBlockId: string,
  updatedSourceBlocks: BlockWithItems[],
  updatedDestBlocks: BlockWithItems[],
  movedItemId: string,
  nextPageNumber: number
): Partial<Materia>[] => {
  const itemsToUpdate: Partial<Materia>[] = [];
  
  // Add updates for source block items (ordem changes)
  const updatedSourceBlock = updatedSourceBlocks.find(b => b.id === sourceBlockId);
  if (updatedSourceBlock) {
    itemsToUpdate.push(...updatedSourceBlock.items.map(item => ({
      id: item.id,
      bloco_id: item.bloco_id,
      ordem: item.ordem,
      retranca: item.retranca
    })));
  }
  
  // Add updates for destination block items (including transferred item)
  const updatedDestBlock = updatedDestBlocks.find(b => b.id === destBlockId);
  if (updatedDestBlock) {
    itemsToUpdate.push(...updatedDestBlock.items.map(item => ({
      id: item.id,
      bloco_id: item.bloco_id,
      ordem: item.ordem,
      retranca: item.retranca,
      pagina: item.id === movedItemId ? nextPageNumber.toString() : item.pagina
    })));
  }
  
  return itemsToUpdate;
};
