
import { useToast } from "@/hooks/use-toast";
import { BlockWithItems } from "./types";
import { updateMateriasOrdem } from "@/services/api";
import { findHighestPageNumber } from "@/components/news-schedule/utils";
import {
  isPanelMovement,
  findBlocks,
  updateSourceBlocks,
  updateDestinationBlocks,
  prepareItemsToUpdate
} from "./utils";

interface UseCrossPanelTransferProps {
  primaryBlocks: BlockWithItems[];
  secondaryBlocks: BlockWithItems[];
  setPrimaryBlocks: React.Dispatch<React.SetStateAction<BlockWithItems[]>>;
  setSecondaryBlocks: React.Dispatch<React.SetStateAction<BlockWithItems[]>>;
}

export const useCrossPanelTransfer = ({
  primaryBlocks,
  secondaryBlocks,
  setPrimaryBlocks,
  setSecondaryBlocks
}: UseCrossPanelTransferProps) => {
  const { toast } = useToast();

  const executeTransfer = async (
    sourceBlockId: string,
    destBlockId: string,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    const { sourceIsPrimary, destIsPrimary, isCrossPanel } = isPanelMovement(
      sourceBlockId,
      destBlockId,
      primaryBlocks,
      secondaryBlocks
    );

    // If moving within the same panel, let the existing drag and drop handle it
    if (!isCrossPanel) {
      return false;
    }

    console.log('Cross-panel drag detected:', { sourceIsPrimary, destIsPrimary, sourceBlockId, destBlockId });

    // Get source and destination blocks
    const sourceBlocks = sourceIsPrimary ? primaryBlocks : secondaryBlocks;
    const destBlocks = destIsPrimary ? primaryBlocks : secondaryBlocks;

    const { sourceBlock, destBlock } = findBlocks(sourceBlockId, destBlockId, sourceBlocks, destBlocks);

    if (!sourceBlock || !destBlock) return false;

    // Get the item being moved
    const movedItem = sourceBlock.items[sourceIndex];
    if (!movedItem) return false;

    // Calculate the next page number for the destination telejornal
    const highestPageInDest = findHighestPageNumber(destBlocks);
    const nextPageNumber = highestPageInDest + 1;

    console.log('Transferring materia with new page number:', {
      materiaId: movedItem.id,
      oldPage: movedItem.pagina,
      newPage: nextPageNumber.toString()
    });

    try {
      // Update source blocks (remove item)
      const updatedSourceBlocks = updateSourceBlocks(sourceBlocks, sourceBlockId, sourceIndex);

      // Update destination blocks (add item)
      const updatedDestBlocks = updateDestinationBlocks(
        destBlocks,
        destBlockId,
        destinationIndex,
        movedItem,
        nextPageNumber
      );

      // Update UI state immediately
      if (sourceIsPrimary) {
        setPrimaryBlocks(updatedSourceBlocks);
        setSecondaryBlocks(updatedDestBlocks);
      } else {
        setSecondaryBlocks(updatedSourceBlocks);
        setPrimaryBlocks(updatedDestBlocks);
      }

      // Prepare updates for database
      const itemsToUpdate = prepareItemsToUpdate(
        sourceBlockId,
        destBlockId,
        updatedSourceBlocks,
        updatedDestBlocks,
        movedItem.id,
        nextPageNumber
      );

      // Update database
      if (itemsToUpdate.length > 0) {
        await updateMateriasOrdem(itemsToUpdate);
        console.log('Cross-panel transfer completed successfully');

        toast({
          title: "Matéria transferida",
          description: `Matéria "${movedItem.retranca}" transferida com página ${nextPageNumber}`,
        });
      }

      return true;

    } catch (error) {
      console.error("Error during cross-panel transfer:", error);

      // Revert UI changes on error
      if (sourceIsPrimary) {
        setPrimaryBlocks(primaryBlocks);
        setSecondaryBlocks(secondaryBlocks);
      } else {
        setSecondaryBlocks(secondaryBlocks);
        setPrimaryBlocks(primaryBlocks);
      }

      toast({
        title: "Erro na transferência",
        description: "Não foi possível transferir a matéria entre telejornais",
        variant: "destructive"
      });

      return false;
    }
  };

  return { executeTransfer };
};
