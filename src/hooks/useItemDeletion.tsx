
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Bloco, Materia, Telejornal } from "@/types";
import { deleteMateria } from "@/services/api";

interface UseItemDeletionProps {
  blocks: (Bloco & { items: Materia[], totalTime: number })[];
  setBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[], totalTime: number })[]>>;
  currentTelejornal: Telejornal | null;
}

export const useItemDeletion = ({
  blocks,
  setBlocks,
  currentTelejornal
}: UseItemDeletionProps) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [materiaToDelete, setMateriaToDelete] = useState<Materia | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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
    
    setIsDeleting(true);
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
      
      toast({
        title: "Sucesso",
        description: "Matéria excluída com sucesso",
      });
    } catch (error) {
      console.error("Erro ao excluir matéria:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a matéria",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBatchDeleteMaterias = async (materiasToDelete: Materia[]) => {
    // Can't delete items if espelho is not open
    if (!currentTelejornal?.espelho_aberto) {
      toast({
        title: "Espelho fechado",
        description: "Você precisa abrir o espelho para excluir matérias.",
        variant: "destructive"
      });
      return;
    }

    if (materiasToDelete.length === 0) return;

    setIsDeleting(true);
    
    try {
      // Delete all materias simultaneously using Promise.all
      await Promise.all(
        materiasToDelete.map(materia => deleteMateria(materia.id))
      );

      // Get all materia IDs to remove
      const materiaIdsToRemove = new Set(materiasToDelete.map(m => m.id));

      // Update UI after successful batch deletion
      setBlocks(blocks.map(block => {
        // Check if this block has any materias to be deleted
        const hasMateriasToDelete = block.items.some(item => materiaIdsToRemove.has(item.id));
        
        if (hasMateriasToDelete) {
          const updatedItems = block.items.filter(item => !materiaIdsToRemove.has(item.id));
          return {
            ...block,
            items: updatedItems,
            totalTime: updatedItems.reduce((sum, item) => sum + item.duracao, 0)
          };
        }
        return block;
      }));

      toast({
        title: "Sucesso",
        description: `${materiasToDelete.length} matéria${materiasToDelete.length > 1 ? 's' : ''} excluída${materiasToDelete.length > 1 ? 's' : ''} com sucesso`,
      });

    } catch (error) {
      console.error("Erro ao excluir matérias em lote:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir todas as matérias selecionadas",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    materiaToDelete,
    setMateriaToDelete,
    isDeleting,
    handleDeleteMateria,
    confirmDeleteMateria,
    handleBatchDeleteMaterias
  };
};
