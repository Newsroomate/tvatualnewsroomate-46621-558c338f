
import { Bloco, Materia } from "@/types";

interface UseEnhancedBlockActionsProps {
  blocks: (Bloco & { items: Materia[], totalTime: number })[];
  handleAddBlock: () => Promise<any>;
  handleAddFirstBlock: () => Promise<any>;
  handleAddItem: (blockId: string) => void;
  scrollToBottom: () => void;
  scrollToBlock: (blockId: string) => void;
}

export const useEnhancedBlockActions = ({
  blocks,
  handleAddBlock,
  handleAddFirstBlock,
  handleAddItem,
  scrollToBottom,
  scrollToBlock
}: UseEnhancedBlockActionsProps) => {
  const handleAddBlockWithScroll = async () => {
    const previousBlockCount = blocks.length;
    await handleAddBlock();
    
    setTimeout(() => {
      if (blocks.length > previousBlockCount) {
        scrollToBottom();
      }
    }, 100);
  };

  const handleAddFirstBlockWithScroll = async () => {
    const previousBlockCount = blocks.length;
    await handleAddFirstBlock();
    
    setTimeout(() => {
      if (blocks.length > previousBlockCount) {
        scrollToBottom();
      }
    }, 100);
  };

  const handleAddItemWithScroll = (blockId: string) => {
    const targetBlock = blocks.find(block => block.id === blockId);
    const previousItemCount = targetBlock?.items.length || 0;
    
    handleAddItem(blockId);
    
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
