
import { Bloco, Materia } from "@/types";

interface UseEnhancedHandlersProps {
  blocks: (Bloco & { items: Materia[], totalTime: number })[];
  handleAddBlock: () => Promise<void>;
  handleAddFirstBlock: () => Promise<void>;
  handleAddItem: (blockId: string) => void;
  scrollToBottom: () => void;
  scrollToBlock: (blockId: string) => void;
}

export const useEnhancedHandlers = ({
  blocks,
  handleAddBlock,
  handleAddFirstBlock,
  handleAddItem,
  scrollToBottom,
  scrollToBlock
}: UseEnhancedHandlersProps) => {

  // Enhanced handleAddBlock with auto-scroll
  const handleAddBlockWithScroll = async () => {
    const previousBlockCount = blocks.length;
    await handleAddBlock();
    
    // Wait a bit for the DOM to update, then scroll
    setTimeout(() => {
      if (blocks.length > previousBlockCount) {
        scrollToBottom();
      }
    }, 100);
  };

  // Enhanced handleAddFirstBlock with auto-scroll
  const handleAddFirstBlockWithScroll = async () => {
    const previousBlockCount = blocks.length;
    await handleAddFirstBlock();
    
    // Wait a bit for the DOM to update, then scroll
    setTimeout(() => {
      if (blocks.length > previousBlockCount) {
        scrollToBottom();
      }
    }, 100);
  };

  // Enhanced handleAddItem with auto-scroll
  const handleAddItemWithScroll = (blockId: string) => {
    const targetBlock = blocks.find(block => block.id === blockId);
    const previousItemCount = targetBlock?.items.length || 0;
    
    handleAddItem(blockId);
    
    // Wait a bit for the DOM to update, then scroll to the block
    setTimeout(() => {
      const updatedBlock = blocks.find(block => block.id === blockId);
      if (updatedBlock && updatedBlock.items.length > previousItemCount) {
        scrollToBlock(blockId);
      }
    }, 100);
  };

  return {
    handleAddBlockWithScroll,
    handleAddFirstBlockWithScroll,
    handleAddItemWithScroll
  };
};
