
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Bloco, Materia, Telejornal } from "@/types";
import { deleteMateria } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { canDeleteMaterias, getPermissionErrorMessage } from "@/utils/permission-checker";

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
  const { profile } = useAuth();

  const handleDeleteMateria = (item: Materia) => {
    // Check if user has permission to delete
    if (!canDeleteMaterias(profile)) {
      toast({
        title: "Acesso negado",
        description: getPermissionErrorMessage('delete_materia'),
        variant: "destructive"
      });
      return;
    }

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
    
    // Double-check permission before deletion
    if (!canDeleteMaterias(profile)) {
      toast({
        title: "Acesso negado",
        description: getPermissionErrorMessage('delete_materia'),
        variant: "destructive"
      });
      setDeleteConfirmOpen(false);
      setMateriaToDelete(null);
      return;
    }
    
    setIsDeleting(true);
    
    try {
      console.log('Attempting to delete materia:', materiaToDelete.id, 'User role:', profile?.role);
      
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
      
      toast({
        title: "Sucesso",
        description: "Matéria excluída com sucesso.",
      });
      
      setDeleteConfirmOpen(false);
      setMateriaToDelete(null);
    } catch (error: any) {
      console.error("Erro ao excluir matéria:", error);
      
      // Handle specific RLS permission errors
      if (error?.message?.includes('row-level security') || error?.code === '42501') {
        toast({
          title: "Erro de Permissão",
          description: "Você não tem permissão para excluir esta matéria. Apenas o Editor-Chefe pode realizar esta ação.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro",
          description: error?.message || "Não foi possível excluir a matéria",
          variant: "destructive"
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBatchDeleteMaterias = async (materiasToDelete: Materia[]) => {
    // Check if user has permission to batch delete
    if (!canDeleteMaterias(profile)) {
      toast({
        title: "Acesso negado",
        description: getPermissionErrorMessage('batch_delete_materias'),
        variant: "destructive"
      });
      return;
    }

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

    console.log('Attempting batch delete of', materiasToDelete.length, 'materias. User role:', profile?.role);
    
    setIsDeleting(true);
    
    try {
      // Delete all selected materias simultaneously
      const deletePromises = materiasToDelete.map(materia => {
        console.log('Deleting materia:', materia.id);
        return deleteMateria(materia.id);
      });
      
      await Promise.all(deletePromises);
      
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
      
    } catch (error: any) {
      console.error("Erro ao excluir matérias em lote:", error);
      
      // Handle specific RLS permission errors
      if (error?.message?.includes('row-level security') || error?.code === '42501') {
        toast({
          title: "Erro de Permissão",
          description: "Você não tem permissão para excluir matérias. Apenas o Editor-Chefe pode realizar esta ação.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro",
          description: error?.message || "Não foi possível excluir algumas matérias. Tente novamente.",
          variant: "destructive"
        });
      }
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
    handleBatchDeleteMaterias,
    canDelete: canDeleteMaterias(profile)
  };
};
