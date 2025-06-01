
import { Bloco, Materia } from "@/types";

interface UseEnhancedHandlersProps {
  blocks: (Bloco & { items: Materia[], totalTime: number })[];
  handleAddBlock: () => Promise<any>;
  handleAddFirstBlock: () => Promise<any>;
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

  // Enhanced handleAddBlock with improved auto-scroll
  const handleAddBlockWithScroll = async () => {
    const previousBlockCount = blocks.length;
    await handleAddBlock();
    
    // Wait for DOM update and scroll with better timing
    setTimeout(() => {
      if (blocks.length > previousBlockCount) {
        scrollToBottom();
      }
    }, 200); // Increased timeout for better reliability
  };

  // Enhanced handleAddFirstBlock with improved auto-scroll
  const handleAddFirstBlockWithScroll = async () => {
    const previousBlockCount = blocks.length;
    await handleAddFirstBlock();
    
    // Wait for DOM update and scroll with better timing
    setTimeout(() => {
      if (blocks.length > previousBlockCount) {
        scrollToBottom();
      }
    }, 200); // Increased timeout for better reliability
  };

  // Enhanced handleAddItem with improved auto-scroll to specific block
  const handleAddItemWithScroll = (blockId: string) => {
    const targetBlock = blocks.find(block => block.id === blockId);
    const previousItemCount = targetBlock?.items.length || 0;
    
    handleAddItem(blockId);
    
    // Wait for DOM update and scroll to the block with better timing
    setTimeout(() => {
      const updatedBlock = blocks.find(block => block.id === blockId);
      if (updatedBlock && updatedBlock.items.length > previousItemCount) {
        scrollToBlock(blockId);
        
        // Additional scroll to bottom if this is the last block
        setTimeout(() => {
          const isLastBlock = blocks[blocks.length - 1]?.id === blockId;
          if (isLastBlock) {
            scrollToBottom();
          }
        }, 300);
      }
    }, 200); // Increased timeout for better reliability
  };

  return {
    handleAddBlockWithScroll,
    handleAddFirstBlockWithScroll,
    handleAddItemWithScroll
  };
};
