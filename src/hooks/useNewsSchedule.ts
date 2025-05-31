
import { Materia, Telejornal, Bloco } from "@/types";
import { useBlocksState } from "./useBlocksState";
import { useNewsScheduleState } from "./useNewsScheduleState";
import { useBlockManagement } from "./useBlockManagement";
import { useItemManagement } from "./useItemManagement";
import { useDragAndDrop } from "./useDragAndDrop";
import { useRealtimeMaterias } from "./useRealtimeMaterias";
import { useTeleprompterWindow } from "./useTeleprompterWindow";
import { useEffect } from "react";

interface UseNewsScheduleProps {
  selectedJournal: string | null;
  currentTelejornal: Telejornal | null;
  onEditItem: (item: Materia) => void;
  journalPrefix?: string;
  externalBlocks?: (Bloco & { items: Materia[], totalTime: number })[];
  setExternalBlocks?: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[], totalTime: number })[]>>;
}

export const useNewsSchedule = ({ 
  selectedJournal, 
  currentTelejornal, 
  onEditItem,
  journalPrefix = "default",
  externalBlocks,
  setExternalBlocks
}: UseNewsScheduleProps) => {
  // Block state management
  const {
    blocks: internalBlocks,
    setBlocks: setInternalBlocks,
    totalJournalTime,
    setTotalJournalTime,
    isLoading,
    blocosQuery
  } = useBlocksState({ selectedJournal });

  // Use external blocks if provided (dual view), otherwise use internal blocks
  const blocks = externalBlocks || internalBlocks;
  const setBlocks = setExternalBlocks || setInternalBlocks;

  // UI state management
  const {
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
  } = useNewsScheduleState();

  // Initialize realtime subscription for materias
  useRealtimeMaterias({
    setBlocks: setExternalBlocks || setInternalBlocks,
    setTotalJournalTime,
    enabled: !!selectedJournal && !!currentTelejornal
  });

  // Sync internal blocks to external blocks if in dual view
  useEffect(() => {
    if (externalBlocks && setExternalBlocks && internalBlocks.length > 0) {
      setExternalBlocks(internalBlocks);
    }
  }, [internalBlocks, externalBlocks, setExternalBlocks]);

  // Hooks for block and item management
  const {
    handleAddFirstBlock,
    handleAddBlock,
    handleRenameBlock,
    handleDeleteBlock
  } = useBlockManagement({ 
    blocks, 
    setBlocks, 
    selectedJournal,
    currentTelejornal, 
    blocosQuery
  });

  const {
    handleAddItem,
    handleDuplicateItem,
    handleDeleteMateria,
    confirmDeleteMateria,
    handleRenumberItems,
    confirmRenumberItems
  } = useItemManagement({ 
    blocks, 
    setBlocks, 
    currentTelejornal,
    newItemBlock,
    setNewItemBlock,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    materiaToDelete,
    setMateriaToDelete,
    renumberConfirmOpen,
    setRenumberConfirmOpen
  });

  const { handleDragEnd } = useDragAndDrop({ 
    blocks, 
    setBlocks, 
    isEspelhoAberto: !!currentTelejornal?.espelho_aberto,
    journalPrefix
  });

  const { openTeleprompter } = useTeleprompterWindow();

  return {
    blocks,
    totalJournalTime,
    isLoading,
    isCreatingFirstBlock,
    newItemBlock,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    renumberConfirmOpen,
    setRenumberConfirmOpen,
    handleAddItem,
    handleDuplicateItem,
    handleDeleteMateria,
    confirmDeleteMateria,
    handleRenumberItems,
    confirmRenumberItems,
    handleAddFirstBlock,
    handleAddBlock,
    handleRenameBlock,
    handleDeleteBlock,
    handleDragEnd,
    openTeleprompter
  };
};
