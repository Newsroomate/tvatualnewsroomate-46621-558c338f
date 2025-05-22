
import { useState } from "react";
import { Materia, Telejornal } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { deleteMateria } from "@/services/api";
import { BlockWithItems, logger } from "../useRealtimeMaterias/utils";

export const useDeleteItem = (
  setBlocks?: React.Dispatch<React.SetStateAction<BlockWithItems[]>>,
  currentTelejornal?: Telejornal | null,
  setMateriaToDelete?: React.Dispatch<React.SetStateAction<Materia | null>>,
  setDeleteConfirmOpen?: React.Dispatch<React.SetStateAction<boolean>>
) => {
  // Initialize state if not provided externally
  const [materiaToDeleteInternal, setMateriaToDeleteInternal] = useState<Materia | null>(null);
  const [deleteConfirmOpenInternal, setDeleteConfirmOpenInternal] = useState(false);
  
  // Use provided state setters or internal ones
  const setMateriaToDeleteState = setMateriaToDelete || setMateriaToDeleteInternal;
  const setDeleteConfirmOpenState = setDeleteConfirmOpen || setDeleteConfirmOpenInternal;
  
  const { toast } = useToast();

  const handleDeleteMateria = (item: Materia) => {
    // Can't delete items if espelho is not open
    if (!currentTelejornal?.espelho_aberto) {
      toast({
        title: "Espelho fechado",
        description: "Você precisa abrir o espelho para excluir matérias.",
        variant: "destructive"
      });
      return;
    }
    
    setMateriaToDeleteState(item);
    setDeleteConfirmOpenState(true);
  };

  const confirmDeleteMateria = async (blocks: BlockWithItems[]) => {
    if (!materiaToDeleteInternal) return;
    
    try {
      await deleteMateria(materiaToDeleteInternal.id);
      
      // Update UI if setBlocks is provided
      if (setBlocks) {
        setBlocks(prevBlocks => prevBlocks.map(block => {
          if (block.id === materiaToDeleteInternal.bloco_id) {
            const updatedItems = block.items.filter(item => item.id !== materiaToDeleteInternal.id);
            return {
              ...block,
              items: updatedItems,
              totalTime: updatedItems.reduce((sum, item) => sum + item.duracao, 0)
            };
          }
          return block;
        }));
      }
      
      setDeleteConfirmOpenState(false);
      setMateriaToDeleteState(null);
    } catch (error) {
      logger.error("Erro ao excluir matéria:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a matéria",
        variant: "destructive"
      });
    }
  };

  return {
    materiaToDelete: materiaToDeleteInternal,
    setMateriaToDelete: setMateriaToDeleteState,
    deleteConfirmOpen: deleteConfirmOpenInternal,
    setDeleteConfirmOpen: setDeleteConfirmOpenState,
    handleDeleteMateria,
    confirmDeleteMateria
  };
};
