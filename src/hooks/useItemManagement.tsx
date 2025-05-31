
import { Bloco, Materia, Telejornal } from "@/types";
import { useItemCreation } from "./useItemCreation";
import { useItemDuplication } from "./useItemDuplication";
import { useItemDeletion } from "./useItemDeletion";
import { useItemRenumbering } from "./useItemRenumbering";

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
  const {
    newItemBlock,
    setNewItemBlock,
    handleAddItem
  } = useItemCreation({ blocks, setBlocks, currentTelejornal });

  const {
    handleDuplicateItem
  } = useItemDuplication({ blocks, setBlocks, currentTelejornal });

  const {
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    materiaToDelete,
    setMateriaToDelete,
    handleDeleteMateria,
    confirmDeleteMateria
  } = useItemDeletion({ blocks, setBlocks, currentTelejornal });

  const {
    renumberConfirmOpen,
    setRenumberConfirmOpen,
    handleRenumberItems,
    confirmRenumberItems
  } = useItemRenumbering({ blocks, setBlocks, currentTelejornal });

  return {
    newItemBlock,
    setNewItemBlock,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    materiaToDelete,
    setMateriaToDelete,
    renumberConfirmOpen,
    setRenumberConfirmOpen,
    handleAddItem,
    handleDuplicateItem,
    handleDeleteMateria,
    confirmDeleteMateria,
    handleRenumberItems,
    confirmRenumberItems
  };
};
