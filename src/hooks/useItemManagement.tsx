
import { Bloco, Materia, Telejornal } from "@/types";
import { useItemCreation } from "./useItemCreation";
import { useItemDuplication } from "./useItemDuplication";
import { useItemDeletion } from "./useItemDeletion";
import { useItemRenumbering } from "./useItemRenumbering";
import { useAuth } from "@/context/AuthContext";
import { canPerformAction } from "@/utils/security-utils";
import { toast } from "@/hooks/use-toast";

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
    confirmRenumberItems
  };
};
