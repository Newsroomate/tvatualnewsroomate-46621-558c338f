
import { useState } from "react";
import { Materia, Telejornal } from "@/types";
import { BlockWithItems } from "./useRealtimeMaterias/utils";

export const useConfirmation = () => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [renumberConfirmOpen, setRenumberConfirmOpen] = useState(false);

  const triggerRenumberItems = async (
    blocks: BlockWithItems[],
    currentTelejornal: Telejornal | null,
    handleRenumberItems: (blocks: BlockWithItems[]) => Promise<boolean>
  ) => {
    const canProceed = await handleRenumberItems(blocks);
    if (canProceed) {
      setRenumberConfirmOpen(true);
    }
  };

  return {
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    renumberConfirmOpen,
    setRenumberConfirmOpen,
    triggerRenumberItems
  };
};
