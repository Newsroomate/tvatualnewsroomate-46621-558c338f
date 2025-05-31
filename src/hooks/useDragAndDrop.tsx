import { useToast } from "@/hooks/use-toast";
import { Bloco, Materia } from "@/types";
import { updateMateriasOrdem, updateMateria } from "@/services/api";
import { calculateBlockTotalTime } from "@/components/news-schedule/utils";

interface UseDragAndDropProps {
  blocks: (Bloco & { items: Materia[], totalTime: number })[];
  setBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[], totalTime: number })[]>>;
  isEspelhoAberto: boolean;
  allowCrossJournalTransfer?: boolean;
}

export const useDragAndDrop = ({ 
  blocks, 
  setBlocks, 
  isEspelhoAberto, 
  allowCrossJournalTransfer = false 
}: UseDragAndDropProps) => {
  const { toast } = useToast();

  const handleDragEnd = async (result: any) => {
    if (!isEspelhoAberto && !allowCrossJournalTransfer) {
      toast({
        title: "Espelho fechado",
        description: "Você precisa abrir o espelho para reordenar matérias.",
        variant: "destructive"
      });
      return;
    }
    
    const { source, destination, draggableId } = result;
    
    // Dropped outside the list or no movement
    if (!destination || 
        (source.droppableId === destination.droppableId && 
         source.index === destination.index)) {
      return;
    }
    
    // Find source and destination blocks
    const sourceBlockId = source.droppableId;
    const destBlockId = destination.droppableId;
    
    const sourceBlock = blocks.find(b => b.id === sourceBlockId);
    const destBlock = blocks.find(b => b.id === destBlockId);
    
    // If blocks are not found in current context, this might be a cross-journal transfer
    if (!sourceBlock || !destBlock) {
      if (allowCrossJournalTransfer) {
        try {
          // Update the materia to move it to the target block
          await updateMateria(draggableId, {
            bloco_id: destBlockId
          });
          
          toast({
            title: "Matéria transferida",
            description: "Matéria movida entre telejornais com sucesso",
            variant: "default"
          });
          
        } catch (error) {
          console.error("Error transferring materia:", error);
          toast({
            title: "Erro na transferência",
            description: "Não foi possível transferir a matéria entre jornais",
            variant: "destructive"
          });
        }
      }
      return;
    }
    
    // Clone current blocks state
    const newBlocks = [...blocks];
    
    // Get the item being moved
    const movedItem = {...sourceBlock.items[source.index]};
    
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
        await updateMateriasOrdem(itemsToUpdate);
        console.log('Updated items ordem successfully:', itemsToUpdate);
      }
      
    } catch (error) {
      console.error("Error updating item positions:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a posição das matérias",
        variant: "destructive"
      });
    }
  };

  return { handleDragEnd };
};
