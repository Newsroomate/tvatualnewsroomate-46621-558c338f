
import { Bloco, Materia } from "@/types";

type BlockWithItems = Bloco & { 
  items: Materia[];
  totalTime: number;
};

interface UseNewsScheduleDualViewProps {
  externalBlocks?: BlockWithItems[];
  onBlocksChange?: (blocks: BlockWithItems[]) => void;
  internalBlocks: BlockWithItems[];
}

export const useNewsScheduleDualView = ({
  externalBlocks,
  onBlocksChange,
  internalBlocks
}: UseNewsScheduleDualViewProps) => {
  const isDualViewMode = !!externalBlocks && !!onBlocksChange;
  
  // Use external blocks in dual view mode, otherwise use internal blocks
  const blocks = isDualViewMode ? externalBlocks : internalBlocks;
  
  // Create a wrapper function that handles both patterns
  const setBlocksWrapper = (updater: (blocks: any[]) => any[]) => {
    if (isDualViewMode && onBlocksChange) {
      // In dual view mode, call the updater function with current blocks and pass result to onBlocksChange
      const updatedBlocks = updater(blocks || []);
      onBlocksChange(updatedBlocks);
    } else {
      // In single view mode, this would be handled by the internal state management
      // but since we're using the wrapper, we need to handle it properly
      console.warn('setBlocks called in non-dual view mode with updater function');
    }
  };

  return {
    isDualViewMode,
    blocks,
    setBlocksWrapper
  };
};
