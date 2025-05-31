
import { useToast } from "@/hooks/use-toast";
import { Bloco, Materia } from "@/types";
import { updateMateriasOrdem } from "@/services/api";
import { validateDragOperation, isCrossPanelDrag, extractBlockIds } from "@/utils/dragDropValidation";
import { createUpdatedBlocks, collectItemsForUpdate } from "@/utils/singleJournalDragUtils";
import { findBlocks, getMovedItem } from "@/utils/blockOperations";

interface UseDragAndDropProps {
  blocks: (Bloco & { items: Materia[], totalTime: number })[];
  setBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[], totalTime: number })[]>>;
  isEspelhoAberto: boolean;
  journalPrefix?: string;
}

export const useDragAndDrop = ({ 
  blocks, 
  setBlocks, 
  isEspelhoAberto, 
  journalPrefix = "default" 
}: UseDragAndDropProps) => {
  const { toast } = useToast();

  const handleDragEnd = async (result: any) => {
    const validation = validateDragOperation(result, isEspelhoAberto);
    
    if (!validation.isValid) {
      if (validation.reason === "Espelho fechado") {
        toast({
          title: "Espelho fechado",
          description: "Você precisa abrir o espelho para reordenar matérias.",
          variant: "destructive"
        });
      }
      return;
    }
    
    const { source, destination } = result;
    
    // Check if this is a cross-panel drag (different journal prefixes)
    if (isCrossPanelDrag(source, destination)) {
      console.log('Cross-panel drag detected, letting parent handle it');
      return;
    }
    
    // Extract actual block IDs (remove journal prefix if present)
    const { sourceBlockId, destBlockId } = extractBlockIds(source, destination, journalPrefix);
    
    // Find source and destination blocks
    const { sourceBlock, destBlock } = findBlocks(blocks, sourceBlockId, destBlockId);
    
    if (!sourceBlock || !destBlock) {
      console.log('Could not find source or destination block');
      return;
    }
    
    // Get the item being moved
    const movedItem = getMovedItem(sourceBlock, source.index);
    console.log('Moving item within same journal:', movedItem);
    
    try {
      // Create updated versions of the blocks
      const updatedBlocks = createUpdatedBlocks(
        blocks,
        sourceBlockId,
        destBlockId,
        source.index,
        destination.index,
        movedItem
      );
      
      // Update UI state immediately for better UX
      setBlocks(updatedBlocks);
      
      // Collect all items that need ordem updates
      const itemsToUpdate = collectItemsForUpdate(updatedBlocks, sourceBlockId, destBlockId);
      
      // Update all changed items in one batch operation
      if (itemsToUpdate.length > 0) {
        console.log('Updating items ordem in database:', itemsToUpdate);
        await updateMateriasOrdem(itemsToUpdate);
        console.log('Updated items ordem successfully');
        
        toast({
          title: "Matéria reordenada",
          description: `Matéria "${movedItem.retranca}" reordenada com sucesso`,
          variant: "default"
        });
      }
      
    } catch (error) {
      console.error("Error updating item positions:", error);
      
      // Revert changes on error
      setBlocks(blocks);
      
      toast({
        title: "Erro ao reordenar",
        description: "Não foi possível reordenar a matéria. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return { handleDragEnd };
};
