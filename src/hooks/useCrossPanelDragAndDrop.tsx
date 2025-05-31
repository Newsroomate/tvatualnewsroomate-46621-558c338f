
import { useToast } from "@/hooks/use-toast";
import { Bloco, Materia } from "@/types";
import { updateMateriasOrdem } from "@/services/api";
import { calculateBlockTotalTime } from "@/components/news-schedule/utils";

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
    const sourceJournal = source.droppableId.includes('primary-') ? 'primary' : 
                         source.droppableId.includes('secondary-') ? 'secondary' : null;
    const destJournal = destination.droppableId.includes('primary-') ? 'primary' : 
                       destination.droppableId.includes('secondary-') ? 'secondary' : null;
    
    if (!sourceJournal || !destJournal) {
      console.log("Could not determine source or destination journal");
      return;
    }
    
    // Extract block IDs (remove journal prefix)
    const sourceBlockId = source.droppableId.replace(/^(primary|secondary)-/, '');
    const destBlockId = destination.droppableId.replace(/^(primary|secondary)-/, '');
    
    // Get the appropriate blocks arrays
    const sourceBlocks = sourceJournal === 'primary' ? primaryBlocks : secondaryBlocks;
    const destBlocks = destJournal === 'primary' ? primaryBlocks : secondaryBlocks;
    
    const sourceBlock = sourceBlocks.find(b => b.id === sourceBlockId);
    const destBlock = destBlocks.find(b => b.id === destBlockId);
    
    if (!sourceBlock || !destBlock) {
      console.log("Could not find source or destination block");
      return;
    }
    
    // Get the item being moved
    const movedItem = {...sourceBlock.items[source.index]};
    console.log('Moving item:', movedItem);
    
    // Calculate next page number for cross-journal transfers
    let nextPageNumber = movedItem.pagina;
    if (sourceJournal !== destJournal) {
      // Find the highest page number in the destination journal
      const allDestItems = destBlocks.flatMap(block => block.items);
      const pageNumbers = allDestItems
        .map(item => parseInt(item.pagina || '0'))
        .filter(num => !isNaN(num));
      
      const maxPageNumber = pageNumbers.length > 0 ? Math.max(...pageNumbers) : 0;
      nextPageNumber = (maxPageNumber + 1).toString();
      
      console.log(`Cross-journal transfer detected. New page number: ${nextPageNumber}`);
    }
    
    try {
      // Update source blocks
      let updatedSourceBlocks = sourceBlocks.map(block => {
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
      
      // Update destination blocks
      let updatedDestBlocks = destBlocks.map(block => {
        if (block.id === destBlockId) {
          const newItems = [...block.items];
          
          // Insert the moved item at the destination index with updated properties
          newItems.splice(destination.index, 0, {
            ...movedItem,
            bloco_id: destBlockId,
            pagina: nextPageNumber
          });
          
          // Update ordem for all items in the destination block
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
      
      // Update UI state immediately for better UX
      if (sourceJournal === 'primary') {
        setPrimaryBlocks(updatedSourceBlocks);
      } else {
        setSecondaryBlocks(updatedSourceBlocks);
      }
      
      if (destJournal === 'primary') {
        setPrimaryBlocks(updatedDestBlocks);
      } else {
        setSecondaryBlocks(updatedDestBlocks);
      }
      
      // Collect all items that need updates
      const itemsToUpdate: Partial<Materia>[] = [];
      
      // Add source block items (if different from destination)
      if (sourceJournal !== destJournal || sourceBlockId !== destBlockId) {
        const updatedSourceBlock = updatedSourceBlocks.find(b => b.id === sourceBlockId);
        if (updatedSourceBlock) {
          itemsToUpdate.push(...updatedSourceBlock.items.map(item => ({
            id: item.id,
            bloco_id: item.bloco_id,
            ordem: item.ordem,
            retranca: item.retranca,
            pagina: item.pagina
          })));
        }
      }
      
      // Add destination block items
      const updatedDestBlock = updatedDestBlocks.find(b => b.id === destBlockId);
      if (updatedDestBlock) {
        itemsToUpdate.push(...updatedDestBlock.items.map(item => ({
          id: item.id,
          bloco_id: item.bloco_id,
          ordem: item.ordem,
          retranca: item.retranca,
          pagina: item.pagina
        })));
      }
      
      // Update all changed items in one batch operation
      if (itemsToUpdate.length > 0) {
        console.log('Updating items in database:', itemsToUpdate);
        await updateMateriasOrdem(itemsToUpdate);
        console.log('Updated items ordem successfully');
        
        if (sourceJournal !== destJournal) {
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
      if (sourceJournal === 'primary') {
        setPrimaryBlocks(primaryBlocks);
      } else {
        setSecondaryBlocks(secondaryBlocks);
      }
      
      if (destJournal === 'primary') {
        setPrimaryBlocks(primaryBlocks);
      } else {
        setSecondaryBlocks(secondaryBlocks);
      }
      
      toast({
        title: "Erro ao transferir matéria",
        description: "Não foi possível mover a matéria. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return { handleCrossPanelDragEnd };
};
