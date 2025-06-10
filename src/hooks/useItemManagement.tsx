
import { Bloco, Materia, Telejornal } from "@/types";
import { useItemCreation } from "./useItemCreation";
import { useItemDuplication } from "./useItemDuplication";
import { useItemDeletion } from "./useItemDeletion";
import { useItemRenumbering } from "./useItemRenumbering";
import { useAuth } from "@/context/AuthContext";
import { canPerformAction } from "@/utils/security-utils";
import { toast } from "@/hooks/use-toast";
import { createMateria, updateMateriasOrdem } from "@/services/materias-api";
import { calculateBlockTotalTime } from "@/components/news-schedule/utils";

interface UseItemManagementProps {
  blocks: (Bloco & { items: Materia[], totalTime: number })[];
  setBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[], totalTime: number })[]>>;
  currentTelejornal: Telejornal | null;
}

export const useItemManagement = ({
  blocks,
  setBlocks,
  currentTelejornal
}: UseItemManagementProps) => {
  const { profile } = useAuth();

  const {
    newItemBlock,
    setNewItemBlock,
    handleAddItem: originalHandleAddItem
  } = useItemCreation({ blocks, setBlocks, currentTelejornal });

  const {
    handleDuplicateItem: originalHandleDuplicateItem
  } = useItemDuplication({ blocks, setBlocks, currentTelejornal });

  const {
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    materiaToDelete,
    setMateriaToDelete,
    isDeleting,
    handleDeleteMateria: originalHandleDeleteMateria,
    confirmDeleteMateria: originalConfirmDeleteMateria,
    handleBatchDeleteMaterias: originalHandleBatchDeleteMaterias
  } = useItemDeletion({ blocks, setBlocks, currentTelejornal });

  const {
    renumberConfirmOpen,
    setRenumberConfirmOpen,
    handleRenumberItems: originalHandleRenumberItems,
    confirmRenumberItems: originalConfirmRenumberItems
  } = useItemRenumbering({ blocks, setBlocks, currentTelejornal });

  // Handle pasting materias
  const handlePasteMaterias = async (materiasData: Partial<Materia>[], targetMateria?: Materia) => {
    if (!canPerformAction(profile, 'create', 'materia')) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para colar matérias.",
        variant: "destructive",
      });
      return;
    }

    try {
      const createdMaterias: Materia[] = [];
      
      // Create each materia
      for (const materiaData of materiasData) {
        const newMateria = await createMateria(materiaData);
        createdMaterias.push(newMateria);
      }

      // Update local state to reflect the new materias
      setBlocks(prevBlocks => {
        return prevBlocks.map(block => {
          if (block.id === materiasData[0]?.bloco_id) {
            const currentItems = [...block.items];
            
            // Find insertion point
            let insertIndex = currentItems.length;
            if (targetMateria) {
              const targetIndex = currentItems.findIndex(item => item.id === targetMateria.id);
              if (targetIndex !== -1) {
                insertIndex = targetIndex + 1;
              }
            }

            // Insert new materias at the correct position
            const newItems = [
              ...currentItems.slice(0, insertIndex),
              ...createdMaterias,
              ...currentItems.slice(insertIndex)
            ];

            // Update ordem for all items
            const updatedItems = newItems.map((item, index) => ({
              ...item,
              ordem: index + 1
            }));

            // Update ordem in the database
            updateMateriasOrdem(updatedItems).catch(console.error);

            return {
              ...block,
              items: updatedItems,
              totalTime: calculateBlockTotalTime(updatedItems)
            };
          }
          return block;
        });
      });

      toast({
        title: "Matérias coladas",
        description: `${createdMaterias.length} matéria(s) colada(s) com sucesso`,
      });

    } catch (error) {
      console.error('Erro ao colar matérias:', error);
      toast({
        title: "Erro ao colar matérias",
        description: "Não foi possível colar as matérias selecionadas",
        variant: "destructive"
      });
    }
  };

  // Security-wrapped handlers
  const handleAddItem = async (blockId: string) => {
    if (!canPerformAction(profile, 'create', 'materia')) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para criar matérias.",
        variant: "destructive",
      });
      return;
    }
    return originalHandleAddItem(blockId);
  };

  const handleDuplicateItem = async (item: Materia) => {
    if (!canPerformAction(profile, 'create', 'materia')) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para duplicar matérias.",
        variant: "destructive",
      });
      return;
    }
    return originalHandleDuplicateItem(item);
  };

  const handleDeleteMateria = async (item: Materia) => {
    if (!canPerformAction(profile, 'delete', 'materia')) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para excluir matérias.",
        variant: "destructive",
      });
      return;
    }
    return originalHandleDeleteMateria(item);
  };

  const confirmDeleteMateria = async () => {
    if (!canPerformAction(profile, 'delete', 'materia')) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para excluir matérias.",
        variant: "destructive",
      });
      return;
    }
    return originalConfirmDeleteMateria();
  };

  const handleBatchDeleteMaterias = async (items: Materia[]) => {
    if (!canPerformAction(profile, 'delete', 'materia')) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para excluir matérias.",
        variant: "destructive",
      });
      return;
    }
    return originalHandleBatchDeleteMaterias(items);
  };

  const handleRenumberItems = async () => {
    if (!canPerformAction(profile, 'update', 'materia')) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para reordenar matérias.",
        variant: "destructive",
      });
      return;
    }
    return originalHandleRenumberItems();
  };

  const confirmRenumberItems = async () => {
    if (!canPerformAction(profile, 'update', 'materia')) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para reordenar matérias.",
        variant: "destructive",
      });
      return;
    }
    return originalConfirmRenumberItems();
  };

  return {
    newItemBlock,
    setNewItemBlock,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    materiaToDelete,
    setMateriaToDelete,
    renumberConfirmOpen,
    setRenumberConfirmOpen,
    isDeleting,
    handleAddItem,
    handleDuplicateItem,
    handleDeleteMateria,
    confirmDeleteMateria,
    handleBatchDeleteMaterias,
    handleRenumberItems,
    confirmRenumberItems,
    handlePasteMaterias
  };
};
