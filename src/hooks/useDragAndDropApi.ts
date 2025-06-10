
import { useToast } from "@/hooks/use-toast";
import { updateMateriasOrdem } from "@/services/api";
import { Materia } from "@/types";

export const useDragAndDropApi = () => {
  const { toast } = useToast();

  const updateItemsOrdem = async (itemsToUpdate: Partial<Materia>[]) => {
    try {
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

  return {
    updateItemsOrdem
  };
};
