
import { useToast } from "@/hooks/use-toast";
import { Bloco, Materia } from "@/types";
import { updateMateriasOrdem } from "@/services/api";
import { calculateBlockTotalTime } from "@/components/news-schedule/utils";

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
    
    // Check if this is a cross-panel drag (different journal prefixes)
    const sourceJournal = source.droppableId.includes('primary-') ? 'primary' : 
                         source.droppableId.includes('secondary-') ? 'secondary' : 'single';
    const destJournal = destination.droppableId.includes('primary-') ? 'primary' : 
                       destination.droppableId.includes('secondary-') ? 'secondary' : 'single';
    
    // If this is a cross-panel drag, let the parent DragDropContext handle it
    if (sourceJournal !== destJournal && (sourceJournal !== 'single' || destJournal !== 'single')) {
      console.log('Cross-panel drag detected, letting parent handle it');
      return;
    }
    
    // Extract actual block IDs (remove journal prefix if present)
    let sourceBlockId = source.droppableId;
    let destBlockId = destination.droppableId;
    
    if (journalPrefix && journalPrefix !== "default") {
      sourceBlockId = sourceBlockId.replace(`${journalPrefix}-`, '');
      destBlockId = destBlockId.replace(`${journalPrefix}-`, '');
    }
    
    // Find source and destination blocks
    const sourceBlock = blocks.find(b => b.id === sourceBlockId);
    const destBlock = blocks.find(b => b.id === destBlockId);
    
    if (!sourceBlock || !destBlock) {
      console.log('Could not find source or destination block');
      return;
    }
    
    // Clone current blocks state
    const newBlocks = [...blocks];
    
    // Get the item being moved
    const movedItem = {...sourceBlock.items[source.index]};
    console.log('Moving item within same journal:', movedItem);
    
    // Create updated versions of the source and destination blocks
    const updatedBlocks = newBlocks.map(block => {
      // Handle source block
      if (block.id === sourceBlockId) {
        const newItems = [...block.items];
        newItems.splice(source.index, 1);
        
        // If moving within the same block, we need to update all items' ordem
        if (sourceBlockId === destBlockId) {
          // Re-insert the item at the destination index
          newItems.splice(destination.index, 0, {
            ...movedItem,
            bloco_id: destBlockId,
          });
          
          // Update ordem for all items in the block
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
        
        // If moved to a different block, just remove from source
        return {
          ...block,
          items: newItems.map((item, index) => ({
            ...item,
            ordem: index + 1
          })),
          totalTime: calculateBlockTotalTime(newItems)
        };
      }
      
      // Handle destination block (if different from source)
      if (block.id === destBlockId && sourceBlockId !== destBlockId) {
        const newItems = [...block.items];
        
        // Insert the moved item at the destination index
        newItems.splice(destination.index, 0, {
          ...movedItem,
          bloco_id: destBlockId,
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
    setBlocks(updatedBlocks);
    
    try {
      // Collect all items that need ordem updates
      const itemsToUpdate: Partial<Materia>[] = [];
      
      // If same block, update all items in that block
      if (sourceBlockId === destBlockId) {
        const updatedBlock = updatedBlocks.find(b => b.id === sourceBlockId);
        if (updatedBlock) {
          itemsToUpdate.push(...updatedBlock.items.map(item => ({
            id: item.id,
            bloco_id: item.bloco_id,
            ordem: item.ordem,
            retranca: item.retranca
          })));
        }
      } else {
        // If different blocks, update items in both blocks
        const updatedSourceBlock = updatedBlocks.find(b => b.id === sourceBlockId);
        const updatedDestBlock = updatedBlocks.find(b => b.id === destBlockId);
        
        if (updatedSourceBlock) {
          itemsToUpdate.push(...updatedSourceBlock.items.map(item => ({
            id: item.id,
            bloco_id: item.bloco_id,
            ordem: item.ordem,
            retranca: item.retranca
          })));
        }
        
        if (updatedDestBlock) {
          itemsToUpdate.push(...updatedDestBlock.items.map(item => ({
            id: item.id,
            bloco_id: item.bloco_id,
            ordem: item.ordem,
            retranca: item.retranca
          })));
        }
      }
      
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
