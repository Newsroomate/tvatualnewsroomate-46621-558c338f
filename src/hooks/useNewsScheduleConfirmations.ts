
import { useState } from "react";

export const useNewsScheduleConfirmations = () => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [renumberConfirmOpen, setRenumberConfirmOpen] = useState(false);

  return {
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    renumberConfirmOpen,
    setRenumberConfirmOpen
  };
};
