
import { useState } from "react";

export const useNewsScheduleState = () => {
  const [isCreatingFirstBlock, setIsCreatingFirstBlock] = useState(false);
  const [newItemBlock, setNewItemBlock] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [materiaToDelete, setMateriaToDelete] = useState<any>(null);
  const [renumberConfirmOpen, setRenumberConfirmOpen] = useState(false);

  return {
    isCreatingFirstBlock,
    setIsCreatingFirstBlock,
    newItemBlock,
    setNewItemBlock,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    materiaToDelete,
    setMateriaToDelete,
    renumberConfirmOpen,
    setRenumberConfirmOpen
  };
};
