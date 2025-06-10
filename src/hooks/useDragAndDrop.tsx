
import { Bloco, Materia } from "@/types";
import { useDragAndDropValidation } from "./useDragAndDropValidation";
import { useDragAndDropOperations } from "./useDragAndDropOperations";
import { useDragAndDropApi } from "./useDragAndDropApi";

interface UseDragAndDropProps {
  blocks: (Bloco & { items: Materia[], totalTime: number })[];
  setBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[], totalTime: number })[]>>;
  isEspelhoAberto: boolean;
  isDualView?: boolean;
}

export const useDragAndDrop = ({ blocks, setBlocks, isEspelhoAberto, isDualView = false }: UseDragAndDropProps) => {
  const { validateEspelhoOpen, validateDragResult, validateDualViewMove } = useDragAndDropValidation({
    isEspelhoAberto,
    isDualView
  });

  const {
    updateBlocksForSameBlock,
    updateBlocksForDifferentBlocks,
    prepareItemsForUpdate
  } = useDragAndDropOperations();

  const { updateItemsOrdem } = useDragAndDropApi();

  const handleDragEnd = async (result: any) => {
    // In dual view mode, cross-panel drag and drop is handled by useCrossPanelDragAndDrop
    // Only handle intra-panel moves here
    if (isDualView && !validateDualViewMove(result, blocks)) {
      return;
    }
    
    if (!validateEspelhoOpen()) {
      return;
    }
    
    if (!validateDragResult(result)) {
      return;
    }
    
    const { source, destination } = result;
    
    // Find source and destination blocks
    const sourceBlockId = source.droppableId;
    const destBlockId = destination.droppableId;
    
    const sourceBlock = blocks.find(b => b.id === sourceBlockId);
    const destBlock = blocks.find(b => b.id === destBlockId);
    
    if (!sourceBlock || !destBlock) return;
    
    // Update blocks based on whether it's same block or different blocks
    let updatedBlocks;
    if (sourceBlockId === destBlockId) {
      updatedBlocks = updateBlocksForSameBlock(
        blocks,
        sourceBlockId,
        source.index,
        destination.index
      );
    } else {
      updatedBlocks = updateBlocksForDifferentBlocks(
        blocks,
        sourceBlockId,
        destBlockId,
        source.index,
        destination.index
      );
    }
    
    // Update UI state immediately for better UX
    setBlocks(updatedBlocks);
    
    // Prepare items for API update
    const itemsToUpdate = prepareItemsForUpdate(updatedBlocks, sourceBlockId, destBlockId);
    
    // Update API
    await updateItemsOrdem(itemsToUpdate);
  };

  return { handleDragEnd };
};
