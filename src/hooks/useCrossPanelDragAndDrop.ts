
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
    console.log('=== Cross-panel drag operation started ===');
    console.log('Drag result:', result);
    console.log('Mirror open status:', isEspelhoAberto);
    
    if (!isEspelhoAberto) {
      console.log('Mirror is closed, aborting drag operation');
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
      console.log('No valid destination or no movement detected');
      return;
    }
    
    // Determine which journal the source and destination belong to
    const sourceJournal = determineJournalFromDroppableId(source.droppableId);
    const destJournal = determineJournalFromDroppableId(destination.droppableId);
    
    console.log('Journal mapping:', { sourceJournal, destJournal });
    
    if (!sourceJournal || !destJournal) {
      console.log("Could not determine source or destination journal");
      return;
    }
    
    // Extract block IDs (remove journal prefix)
    const sourceBlockId = extractBlockId(source.droppableId);
    const destBlockId = extractBlockId(destination.droppableId);
    
    console.log('Block IDs:', { sourceBlockId, destBlockId });
    
    // Get the appropriate blocks arrays
    const sourceBlocks = getBlocksForJournal(sourceJournal, primaryBlocks, secondaryBlocks);
    const destBlocks = getBlocksForJournal(destJournal, primaryBlocks, secondaryBlocks);
    
    console.log('Source blocks count:', sourceBlocks.length);
    console.log('Destination blocks count:', destBlocks.length);
    
    const sourceBlock = findBlock(sourceBlocks, sourceBlockId);
    const destBlock = findBlock(destBlocks, destBlockId);
    
    if (!sourceBlock || !destBlock) {
      console.log("Could not find source or destination block");
      console.log('Source block found:', !!sourceBlock);
      console.log('Destination block found:', !!destBlock);
      return;
    }
    
    // Get the item being moved
    const movedItem = {...sourceBlock.items[source.index]};
    console.log('Moving item:', {
      id: movedItem.id,
      retranca: movedItem.retranca,
      pagina: movedItem.pagina,
      currentBlockId: movedItem.bloco_id
    });
    
    // Calculate next page number for cross-journal transfers
    let nextPageNumber = movedItem.pagina;
    if (shouldUpdatePageNumber(sourceJournal, destJournal)) {
      nextPageNumber = calculateNextPageNumber(destBlocks, movedItem.pagina);
      console.log(`Cross-journal transfer detected. Old page: ${movedItem.pagina}, New page: ${nextPageNumber}`);
    }
    
    try {
      console.log('=== Starting block updates ===');
      
      // Update source and destination blocks
      const updatedSourceBlocks = updateSourceBlocks(sourceBlocks, sourceBlockId, source.index);
      const updatedDestBlocks = updateDestinationBlocks(destBlocks, destBlockId, destination.index, movedItem, nextPageNumber);
      
      console.log('Updated source blocks:', updatedSourceBlocks.length);
      console.log('Updated destination blocks:', updatedDestBlocks.length);
      
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
      
      console.log(`Found ${itemsToUpdate.length} items to update in database`);
      
      // Update all changed items in one batch operation
      if (itemsToUpdate.length > 0) {
        console.log('=== Starting database update ===');
        console.log('Items to update:', itemsToUpdate.map(item => ({ 
          id: item.id, 
          retranca: item.retranca, 
          pagina: item.pagina, 
          bloco_id: item.bloco_id,
          ordem: item.ordem 
        })));
        
        await updateMateriasOrdem(itemsToUpdate);
        console.log('Database update completed successfully');
        
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
      
      console.log('=== Cross-panel drag operation completed successfully ===');
      
    } catch (error) {
      console.error("=== Error in cross-panel drag operation ===");
      console.error("Error details:", error);
      
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
