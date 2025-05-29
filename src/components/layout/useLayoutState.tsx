
import { useState } from "react";
import { Materia, Telejornal } from "@/types/index";

export const useLayoutState = () => {
  const [selectedJournal, setSelectedJournal] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Materia | null>(null);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [currentTelejornal, setCurrentTelejornal] = useState<Telejornal | null>(null);
  const [isCloseRundownDialogOpen, setIsCloseRundownDialogOpen] = useState(false);
  const [isPostCloseModalOpen, setIsPostCloseModalOpen] = useState(false);
  const [isSavedRundownsModalOpen, setIsSavedRundownsModalOpen] = useState(false);
  const [selectedViewDate, setSelectedViewDate] = useState<Date>(new Date());

  return {
    selectedJournal,
    setSelectedJournal,
    selectedItem,
    setSelectedItem,
    isEditPanelOpen,
    setIsEditPanelOpen,
    currentTelejornal,
    setCurrentTelejornal,
    isCloseRundownDialogOpen,
    setIsCloseRundownDialogOpen,
    isPostCloseModalOpen,
    setIsPostCloseModalOpen,
    isSavedRundownsModalOpen,
    setIsSavedRundownsModalOpen,
    selectedViewDate,
    setSelectedViewDate
  };
};
