
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Bloco, Materia, Telejornal } from "@/types";
import { deleteMateria } from "@/services/api";

interface UseItemDeletionProps {
  blocks: (Bloco & { items: Materia[], totalTime: number })[];
  setBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[], totalTime: number })[]>>;
  currentTelejornal: Telejornal | null;
  deleteConfirmOpen: boolean;
  setDeleteConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>;
  materiaToDelete: Materia | null;
  setMateriaToDelete: React.Dispatch<React.SetStateAction<Materia | null>>;
}

export const useItemDeletion = ({
  blocks,
  setBlocks,
  currentTelejornal,
  deleteConfirmOpen,
  setDeleteConfirmOpen,
  materiaToDelete,
  setMateriaToDelete
}: UseItemDeletionProps) => {
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
    
    setMateriaToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteMateria = async () => {
    if (!materiaToDelete) return;
    
    try {
      await deleteMateria(materiaToDelete.id);
      
      // Update UI after successful deletion
      setBlocks(blocks.map(block => {
        if (block.id === materiaToDelete.bloco_id) {
          const updatedItems = block.items.filter(item => item.id !== materiaToDelete.id);
          return {
            ...block,
            items: updatedItems,
            totalTime: updatedItems.reduce((sum, item) => sum + item.duracao, 0)
          };
        }
        return block;
      }));
      
      setDeleteConfirmOpen(false);
      setMateriaToDelete(null);
    } catch (error) {
      console.error("Erro ao excluir matéria:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a matéria",
        variant: "destructive"
      });
    }
  };

  return {
    handleDeleteMateria,
    confirmDeleteMateria
  };
};
