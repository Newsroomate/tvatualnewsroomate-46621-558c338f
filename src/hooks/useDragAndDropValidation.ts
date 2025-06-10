
import { useToast } from "@/hooks/use-toast";

interface UseDragAndDropValidationProps {
  isEspelhoAberto: boolean;
  isDualView?: boolean;
}

export const useDragAndDropValidation = ({ isEspelhoAberto, isDualView = false }: UseDragAndDropValidationProps) => {
  const { toast } = useToast();

  const validateEspelhoOpen = () => {
    if (!isEspelhoAberto) {
      toast({
        title: "Espelho fechado",
        description: "Você precisa abrir o espelho para reordenar matérias.",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const validateDragResult = (result: any) => {
    const { source, destination } = result;
    
    // Dropped outside the list or no movement
    if (!destination || 
        (source.droppableId === destination.droppableId && 
         source.index === destination.index)) {
      return false;
    }
    
    return true;
  };

  const validateDualViewMove = (result: any, blocks: any[]) => {
    if (!isDualView) return true;
    
    const { source, destination } = result;
    const sourceBlockId = source.droppableId;
    const destBlockId = destination.droppableId;
    
    // Check if this is a cross-panel move (different telejornals)
    const sourceBlock = blocks.find(b => b.id === sourceBlockId);
    const destBlock = blocks.find(b => b.id === destBlockId);
    
    // If either block is not found in current blocks, it's a cross-panel move
    // Let the cross-panel handler deal with it
    if (!sourceBlock || !destBlock) {
      return false;
    }
    
    return true;
  };

  return {
    validateEspelhoOpen,
    validateDragResult,
    validateDualViewMove
  };
};
