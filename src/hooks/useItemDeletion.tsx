
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Bloco, Materia, Telejornal } from "@/types";
import { deleteMateria } from "@/services/api";
import { usePermissionGuard } from "@/hooks/usePermissionGuard";

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
  const { checkPermission, guardAction } = usePermissionGuard();

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
    
    // Check permission BEFORE opening confirmation dialog
    if (!checkPermission('delete', 'materia')) {
      return;
    }
    
    setMateriaToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteMateria = async () => {
    if (!materiaToDelete) return;
    
    await guardAction('delete', 'materia', async () => {
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
    });
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

    // Check permission BEFORE proceeding
    if (!checkPermission('delete', 'materia')) {
      return;
    }

    setIsDeleting(true);
    
    try {
      // Delete all selected materias simultaneously
      await Promise.all(materiasToDelete.map(materia => deleteMateria(materia.id)));
      
      // Update UI after successful batch deletion - remove all deleted items at once
      const deletedIds = new Set(materiasToDelete.map(m => m.id));
      
      setBlocks(blocks.map(block => {
        const updatedItems = block.items.filter(item => !deletedIds.has(item.id));
        return {
          ...block,
          items: updatedItems,
          totalTime: updatedItems.reduce((sum, item) => sum + item.duracao, 0)
        };
      }));
      
      toast({
        title: "Sucesso",
        description: `${materiasToDelete.length} matéria${materiasToDelete.length !== 1 ? 's' : ''} excluída${materiasToDelete.length !== 1 ? 's' : ''} com sucesso.`,
      });
      
    } catch (error) {
      console.error("Erro ao excluir matérias em lote:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir algumas matérias. Tente novamente.",
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
