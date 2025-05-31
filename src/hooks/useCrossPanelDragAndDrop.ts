
import { useToast } from "@/hooks/use-toast";
import { Bloco, Materia } from "@/types";
import { updateMateriasOrdem } from "@/services/api";
import { 
  determineJournalFromDroppableId, 
  extractBlockId, 
  getBlocksForJournal, 
  findBlock, 
  isCrossJournalTransfer 
} from "@/utils/crossPanelDragUtils";
import { calculateNextPageNumber, shouldUpdatePageNumber } from "@/utils/pageNumberCalculator";
import { updateSourceBlocks, updateDestinationBlocks, collectItemsToUpdate } from "@/utils/blockUpdateUtils";
import { updateUIState, revertUIState } from "@/utils/dragDropStateUpdater";

interface UseCrossPanelDragAndDropProps {
  primaryBlocks: (Bloco & { items: Materia[], totalTime: number })[];
  setPrimaryBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[], totalTime: number })[]>>;
  secondaryBlocks: (Bloco & { items: Materia[], totalTime: number })[];
  setSecondaryBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[], totalTime: number })[]>>;
  primaryJournal: string;
  secondaryJournal: string;
  isEspelhoAberto: boolean;
}

export const useCrossPanelDragAndDrop = ({
  primaryBlocks,
  setPrimaryBlocks,
  secondaryBlocks,
  setSecondaryBlocks,
  primaryJournal,
  secondaryJournal,
  isEspelhoAberto
}: UseCrossPanelDragAndDropProps) => {
  const { toast } = useToast();

  const handleCrossPanelDragEnd = async (result: any) => {
    if (!isEspelhoAberto) {
      toast({
        title: "Espelho fechado",
        description: "Você precisa abrir o espelho para reordenar matérias.",
        variant: "destructive"
      });
      return;
    }
    
    const { source, destination } = result;
    
    // Dropped outside the list or no movement
    if (!destination || 
        (source.droppableId === destination.droppableId && 
         source.index === destination.index)) {
      return;
    }
    
    // Determine which journal the source and destination belong to
    const sourceJournal = determineJournalFromDroppableId(source.droppableId);
    const destJournal = determineJournalFromDroppableId(destination.droppableId);
    
    if (!sourceJournal || !destJournal) {
      console.log("Could not determine source or destination journal");
      return;
    }
    
    // Extract block IDs (remove journal prefix)
    const sourceBlockId = extractBlockId(source.droppableId);
    const destBlockId = extractBlockId(destination.droppableId);
    
    // Get the appropriate blocks arrays
    const sourceBlocks = getBlocksForJournal(sourceJournal, primaryBlocks, secondaryBlocks);
    const destBlocks = getBlocksForJournal(destJournal, primaryBlocks, secondaryBlocks);
    
    const sourceBlock = findBlock(sourceBlocks, sourceBlockId);
    const destBlock = findBlock(destBlocks, destBlockId);
    
    if (!sourceBlock || !destBlock) {
      console.log("Could not find source or destination block");
      return;
    }
    
    // Get the item being moved
    const movedItem = {...sourceBlock.items[source.index]};
    console.log('Moving item:', movedItem);
    
    // Calculate next page number for cross-journal transfers
    let nextPageNumber = movedItem.pagina;
    if (shouldUpdatePageNumber(sourceJournal, destJournal)) {
      nextPageNumber = calculateNextPageNumber(destBlocks, movedItem.pagina);
      console.log(`Cross-journal transfer detected. New page number: ${nextPageNumber}`);
    }
    
    try {
      // Update source and destination blocks
      const updatedSourceBlocks = updateSourceBlocks(sourceBlocks, sourceBlockId, source.index);
      const updatedDestBlocks = updateDestinationBlocks(destBlocks, destBlockId, destination.index, movedItem, nextPageNumber);
      
      // Update UI state immediately for better UX
      updateUIState(sourceJournal, destJournal, updatedSourceBlocks, updatedDestBlocks, setPrimaryBlocks, setSecondaryBlocks);
      
      // Collect all items that need updates
      const itemsToUpdate = collectItemsToUpdate(
        sourceJournal, 
        destJournal, 
        sourceBlockId, 
        destBlockId, 
        updatedSourceBlocks, 
        updatedDestBlocks
      );
      
      // Update all changed items in one batch operation
      if (itemsToUpdate.length > 0) {
        console.log('Updating items in database:', itemsToUpdate);
        await updateMateriasOrdem(itemsToUpdate);
        console.log('Updated items ordem successfully');
        
        if (isCrossJournalTransfer(sourceJournal, destJournal)) {
          toast({
            title: "Matéria transferida com sucesso",
            description: `Matéria "${movedItem.retranca}" movida entre telejornais. Nova numeração: ${nextPageNumber}`,
            variant: "default"
          });
        } else {
          toast({
            title: "Matéria reordenada",
            description: `Matéria "${movedItem.retranca}" reordenada no mesmo telejornal`,
            variant: "default"
          });
        }
      }
      
    } catch (error) {
      console.error("Error updating item positions:", error);
      
      // Revert UI changes on error
      revertUIState(sourceJournal, destJournal, primaryBlocks, secondaryBlocks, setPrimaryBlocks, setSecondaryBlocks);
      
      toast({
        title: "Erro ao transferir matéria",
        description: "Não foi possível mover a matéria. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return { handleCrossPanelDragEnd };
};
