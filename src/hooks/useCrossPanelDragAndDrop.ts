
import { useToast } from "@/hooks/use-toast";
import { Bloco, Materia } from "@/types";
import { updateMateriasOrdem } from "@/services/api";
import { calculateBlockTotalTime, findHighestPageNumber } from "@/components/news-schedule/utils";

type BlockWithItems = Bloco & { 
  items: Materia[];
  totalTime: number;
};

interface UseCrossPanelDragAndDropProps {
  primaryBlocks: BlockWithItems[];
  secondaryBlocks: BlockWithItems[];
  setPrimaryBlocks: React.Dispatch<React.SetStateAction<BlockWithItems[]>>;
  setSecondaryBlocks: React.Dispatch<React.SetStateAction<BlockWithItems[]>>;
  primaryTelejornal: any;
  secondaryTelejornal: any;
}

export const useCrossPanelDragAndDrop = ({
  primaryBlocks,
  secondaryBlocks,
  setPrimaryBlocks,
  setSecondaryBlocks,
  primaryTelejornal,
  secondaryTelejornal
}: UseCrossPanelDragAndDropProps) => {
  const { toast } = useToast();

  const handleCrossPanelDragEnd = async (result: any) => {
    const { source, destination } = result;
    
    if (!destination) return;
    
    // Check if both espelhos are open
    if (!primaryTelejornal?.espelho_aberto || !secondaryTelejornal?.espelho_aberto) {
      toast({
        title: "Espelhos fechados",
        description: "Ambos os espelhos precisam estar abertos para transferir matérias entre telejornais.",
        variant: "destructive"
      });
      return;
    }

    const sourceBlockId = source.droppableId;
    const destBlockId = destination.droppableId;
    
    // Determine which panel is source and which is destination
    const sourceIsPrimary = primaryBlocks.some(b => b.id === sourceBlockId);
    const destIsPrimary = primaryBlocks.some(b => b.id === destBlockId);
    
    // If moving within the same panel, let the existing drag and drop handle it
    if (sourceIsPrimary === destIsPrimary) {
      return;
    }
    
    console.log('Cross-panel drag detected:', { sourceIsPrimary, destIsPrimary, sourceBlockId, destBlockId });
    
    // Get source and destination blocks
    const sourceBlocks = sourceIsPrimary ? primaryBlocks : secondaryBlocks;
    const destBlocks = destIsPrimary ? primaryBlocks : secondaryBlocks;
    
    const sourceBlock = sourceBlocks.find(b => b.id === sourceBlockId);
    const destBlock = destBlocks.find(b => b.id === destBlockId);
    
    if (!sourceBlock || !destBlock) return;
    
    // Get the item being moved
    const movedItem = sourceBlock.items[source.index];
    if (!movedItem) return;

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
      const updatedSourceBlocks = sourceBlocks.map(block => {
        if (block.id === sourceBlockId) {
          const newItems = [...block.items];
          newItems.splice(source.index, 1);
          
          // Update ordem for remaining items
          const updatedItems = newItems.map((item, index) => ({
            ...item,
            ordem: index + 1
          }));
          
          return {
            ...block,
            items: updatedItems,
            totalTime: calculateBlockTotalTime(updatedItems)
          };
        }
        return block;
      });

      // Update destination blocks (add item)
      const updatedDestBlocks = destBlocks.map(block => {
        if (block.id === destBlockId) {
          const newItems = [...block.items];
          
          // Insert the moved item with updated properties
          const updatedMovedItem = {
            ...movedItem,
            bloco_id: destBlockId,
            pagina: nextPageNumber.toString()
          };
          
          newItems.splice(destination.index, 0, updatedMovedItem);
          
          // Update ordem for all items in destination block
          const updatedItems = newItems.map((item, index) => ({
            ...item,
            ordem: index + 1
          }));
          
          return {
            ...block,
            items: updatedItems,
            totalTime: calculateBlockTotalTime(updatedItems)
          };
        }
        return block;
      });

      // Update UI state immediately
      if (sourceIsPrimary) {
        setPrimaryBlocks(updatedSourceBlocks);
        setSecondaryBlocks(updatedDestBlocks);
      } else {
        setSecondaryBlocks(updatedSourceBlocks);
        setPrimaryBlocks(updatedDestBlocks);
      }

      // Prepare updates for database
      const itemsToUpdate: Partial<Materia>[] = [];
      
      // Add updates for source block items (ordem changes)
      const updatedSourceBlock = updatedSourceBlocks.find(b => b.id === sourceBlockId);
      if (updatedSourceBlock) {
        itemsToUpdate.push(...updatedSourceBlock.items.map(item => ({
          id: item.id,
          bloco_id: item.bloco_id,
          ordem: item.ordem,
          retranca: item.retranca
        })));
      }
      
      // Add updates for destination block items (including transferred item)
      const updatedDestBlock = updatedDestBlocks.find(b => b.id === destBlockId);
      if (updatedDestBlock) {
        itemsToUpdate.push(...updatedDestBlock.items.map(item => ({
          id: item.id,
          bloco_id: item.bloco_id,
          ordem: item.ordem,
          retranca: item.retranca,
          pagina: item.id === movedItem.id ? nextPageNumber.toString() : item.pagina
        })));
      }
      
      // Update database
      if (itemsToUpdate.length > 0) {
        await updateMateriasOrdem(itemsToUpdate);
        console.log('Cross-panel transfer completed successfully');
        
        toast({
          title: "Matéria transferida",
          description: `Matéria "${movedItem.retranca}" transferida com página ${nextPageNumber}`,
        });
      }
      
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
    }
  };

  return { handleCrossPanelDragEnd };
};
