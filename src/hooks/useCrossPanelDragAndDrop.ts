
import { useToast } from "@/hooks/use-toast";
import { Bloco, Materia } from "@/types";
import { updateMateria, updateMateriasOrdem } from "@/services/api";
import { calculateBlockTotalTime } from "@/components/news-schedule/utils";

interface UseCrossPanelDragAndDropProps {
  primaryBlocks: (Bloco & { items: Materia[], totalTime: number })[];
  secondaryBlocks: (Bloco & { items: Materia[], totalTime: number })[];
  setPrimaryBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[], totalTime: number })[]>>;
  setSecondaryBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[], totalTime: number })[]>>;
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

  const getMaxPageNumber = (blocks: (Bloco & { items: Materia[], totalTime: number })[]) => {
    let maxPage = 0;
    blocks.forEach(block => {
      block.items.forEach(item => {
        const pageNum = parseInt(item.pagina || "0");
        if (pageNum > maxPage) {
          maxPage = pageNum;
        }
      });
    });
    return maxPage;
  };

  const handleCrossPanelDragEnd = async (result: any) => {
    const { source, destination } = result;
    
    if (!destination) return;

    // Check if it's a cross-panel drag
    const isPrimaryToSecondary = source.droppableId.startsWith('primary-') && destination.droppableId.startsWith('secondary-');
    const isSecondaryToPrimary = source.droppableId.startsWith('secondary-') && destination.droppableId.startsWith('primary-');
    
    if (!isPrimaryToSecondary && !isSecondaryToPrimary) {
      return false; // Not a cross-panel drag
    }

    // Check if both espelhos are open
    if (!primaryTelejornal?.espelho_aberto || !secondaryTelejornal?.espelho_aberto) {
      toast({
        title: "Espelhos fechados",
        description: "Ambos os espelhos precisam estar abertos para transferir matérias entre eles.",
        variant: "destructive"
      });
      return true; // Handled but blocked
    }

    // Get source and destination blocks
    const sourceBlockId = source.droppableId.replace('primary-', '').replace('secondary-', '');
    const destBlockId = destination.droppableId.replace('primary-', '').replace('secondary-', '');
    
    const sourceBlocks = isPrimaryToSecondary ? primaryBlocks : secondaryBlocks;
    const destBlocks = isPrimaryToSecondary ? secondaryBlocks : primaryBlocks;
    const setSourceBlocks = isPrimaryToSecondary ? setPrimaryBlocks : setSecondaryBlocks;
    const setDestBlocks = isPrimaryToSecondary ? setSecondaryBlocks : setPrimaryBlocks;
    
    const sourceBlock = sourceBlocks.find(b => b.id === sourceBlockId);
    const destBlock = destBlocks.find(b => b.id === destBlockId);
    
    if (!sourceBlock || !destBlock) return true;

    // Get the item being moved
    const movedItem = { ...sourceBlock.items[source.index] };
    
    // Calculate the new page number for destination journal
    const maxPageInDest = getMaxPageNumber(destBlocks);
    const newPageNumber = maxPageInDest + 1;

    try {
      // Update the item with new block_id and page number
      await updateMateria(movedItem.id, {
        bloco_id: destBlockId,
        pagina: newPageNumber.toString(),
        retranca: movedItem.retranca,
        duracao: movedItem.duracao,
        ordem: destination.index + 1
      });

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
          
          // Insert the moved item at the destination index
          newItems.splice(destination.index, 0, {
            ...movedItem,
            bloco_id: destBlockId,
            pagina: newPageNumber.toString(),
            ordem: destination.index + 1
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

      // Update UI state
      setSourceBlocks(updatedSourceBlocks);
      setDestBlocks(updatedDestBlocks);

      // Update ordem for affected items in database
      const itemsToUpdate: Partial<Materia>[] = [];
      
      // Add source block items
      const updatedSourceBlock = updatedSourceBlocks.find(b => b.id === sourceBlockId);
      if (updatedSourceBlock) {
        itemsToUpdate.push(...updatedSourceBlock.items.map(item => ({
          id: item.id,
          bloco_id: item.bloco_id,
          ordem: item.ordem,
          retranca: item.retranca
        })));
      }
      
      // Add destination block items
      const updatedDestBlock = updatedDestBlocks.find(b => b.id === destBlockId);
      if (updatedDestBlock) {
        itemsToUpdate.push(...updatedDestBlock.items.map(item => ({
          id: item.id,
          bloco_id: item.bloco_id,
          ordem: item.ordem,
          retranca: item.retranca
        })));
      }

      if (itemsToUpdate.length > 0) {
        await updateMateriasOrdem(itemsToUpdate);
      }

      toast({
        title: "Matéria transferida",
        description: `Matéria "${movedItem.retranca}" transferida com página ${newPageNumber}`,
        variant: "default"
      });

      console.log(`Cross-panel drag completed: moved item ${movedItem.id} to page ${newPageNumber}`);
      
    } catch (error) {
      console.error("Error in cross-panel drag:", error);
      toast({
        title: "Erro",
        description: "Não foi possível transferir a matéria entre os jornais",
        variant: "destructive"
      });
    }

    return true; // Handled
  };

  return { handleCrossPanelDragEnd };
};
