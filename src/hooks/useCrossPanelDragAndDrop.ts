
import { useCrossPanelValidation, useCrossPanelTransfer } from "./cross-panel";
import type { UseCrossPanelDragAndDropProps } from "./cross-panel";

export const useCrossPanelDragAndDrop = ({
  primaryBlocks,
  secondaryBlocks,
  setPrimaryBlocks,
  setSecondaryBlocks,
  primaryTelejornal,
  secondaryTelejornal
}: UseCrossPanelDragAndDropProps) => {
  const { validateEspelhosOpen, validateDestination } = useCrossPanelValidation();
  const { executeTransfer } = useCrossPanelTransfer({
    primaryBlocks,
    secondaryBlocks,
    setPrimaryBlocks,
    setSecondaryBlocks
  });

  const handleCrossPanelDragEnd = async (result: any) => {
    const { source, destination } = result;
    
    if (!validateDestination(destination)) return;
    
    // Check if both espelhos are open
    if (!validateEspelhosOpen(primaryTelejornal, secondaryTelejornal)) {
      return;
    }

    const sourceBlockId = source.droppableId;
    const destBlockId = destination.droppableId;
    
    // Execute the transfer
    await executeTransfer(
      sourceBlockId,
      destBlockId,
      source.index,
      destination.index
    );
  };

  return { handleCrossPanelDragEnd };
};
