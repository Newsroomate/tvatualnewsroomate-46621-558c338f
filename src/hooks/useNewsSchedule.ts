
import { Materia, Telejornal } from "@/types";
import { useBlocksState } from "./useBlocksState";
import { useNewsScheduleState } from "./useNewsScheduleState";
import { useBlockManagement } from "./useBlockManagement";
import { useItemManagement } from "./useItemManagement";
import { useDragAndDrop } from "./useDragAndDrop";
import { useRealtimeMaterias } from "./useRealtimeMaterias";
import { useTeleprompterWindow } from "./useTeleprompterWindow";

interface UseNewsScheduleProps {
  selectedJournal: string | null;
  currentTelejornal: Telejornal | null;
  onEditItem: (item: Materia) => void;
  journalPrefix?: string;
}

export const useNewsSchedule = ({ 
  selectedJournal, 
  currentTelejornal, 
  onEditItem,
  journalPrefix = "default"
}: UseNewsScheduleProps) => {
  // Block state management
  const {
    blocks,
    setBlocks,
    totalJournalTime,
    setTotalJournalTime,
    isLoading,
    blocosQuery
  } = useBlocksState({ selectedJournal });

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
    setBlocks,
    setTotalJournalTime,
    enabled: !!selectedJournal && !!currentTelejornal
  });

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
