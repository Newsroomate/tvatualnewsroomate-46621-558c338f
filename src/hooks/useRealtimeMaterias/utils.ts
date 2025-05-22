
import { Bloco, Materia } from "@/types";
import { calculateBlockTotalTime } from "@/components/news-schedule/utils";

// Debug logging utility
export const logger = {
  enabled: true,
  debug: (message: string, data?: any) => {
    if (logger.enabled) {
      console.log(`[Debug] ${message}`, data || '');
    }
  },
  info: (message: string, data?: any) => {
    if (logger.enabled) {
      console.log(`[Info] ${message}`, data || '');
    }
  },
  warn: (message: string, data?: any) => {
    if (logger.enabled) {
      console.error(`[Warning] ${message}`, data || '');
    }
  }
};

// Type for blocks with items and calculated time
export type BlockWithItems = Bloco & { 
  items: Materia[];
  totalTime: number;
};

// Update a specific block's items and recalculate totals
export const updateBlockItems = (block: BlockWithItems, items: Materia[]): BlockWithItems => {
  return {
    ...block,
    items,
    totalTime: calculateBlockTotalTime(items)
  };
};

// Find a block by ID in the blocks array
export const findBlockById = (blocks: BlockWithItems[], blockId: string): BlockWithItems | undefined => {
  return blocks.find(block => block.id === blockId);
};

// Find an item by ID in all blocks
export const findItemById = (blocks: BlockWithItems[], itemId: string): { 
  item: Materia | undefined; 
  blockId: string | undefined;
  index: number;
} => {
  for (const block of blocks) {
    const index = block.items.findIndex(item => item.id === itemId);
    if (index !== -1) {
      return { 
        item: block.items[index], 
        blockId: block.id,
        index
      };
    }
  }
  return { item: undefined, blockId: undefined, index: -1 };
};

// Update blocks array with a modified block
export const updateBlocks = (blocks: BlockWithItems[], updatedBlock: BlockWithItems): BlockWithItems[] => {
  return blocks.map(block => block.id === updatedBlock.id ? updatedBlock : block);
};
