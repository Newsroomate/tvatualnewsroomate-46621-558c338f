import { useState } from "react";
import { Bloco, Materia, Telejornal } from "@/types";
import { useNewsSchedule } from "@/hooks/useNewsSchedule";
import { useClipboard } from "@/hooks/useClipboard";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { usePasteMateria } from "@/hooks/usePasteMateria";
import { useNewsScheduleDualView } from "@/hooks/useNewsScheduleDualView";
import { useNewsScheduleActions } from "./NewsScheduleActions";
import { useItemSelection } from "@/hooks/useItemSelection";

type BlockWithItems = Bloco & { 
  items: Materia[];
  totalTime: number;
};

interface NewsScheduleHooksProps {
  selectedJournal: string | null;
  currentTelejornal: Telejornal | null;
  onEditItem: (materia: Materia) => void;
  journalPrefix?: string;
  externalBlocks?: BlockWithItems[];
  onBlocksChange?: (blocks: BlockWithItems[]) => void;
  children: (props: any) => React.ReactNode;
}

export const NewsScheduleHooks = ({
  selectedJournal,
  currentTelejornal,
  onEditItem,
  journalPrefix = "default",
  externalBlocks,
  onBlocksChange,
  children
}: NewsScheduleHooksProps) => {
  const [isSaveModelModalOpen, setIsSaveModelModalOpen] = useState(false);
  const [isSavedModelsModalOpen, setIsSavedModelsModalOpen] = useState(false);
  
  const {
    blocks: internalBlocks,
    totalJournalTime,
    isLoading,
    isCreatingFirstBlock,
    newItemBlock,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
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
    handleAddFirstBlock,
    handleAddBlock,
    handleRenameBlock,
    handleDeleteBlock,
    handleDragEnd,
    openTeleprompter
  } = useNewsSchedule({ 
    selectedJournal, 
    currentTelejornal, 
    onEditItem,
    externalBlocks: !!externalBlocks && !!onBlocksChange ? externalBlocks : undefined,
    onBlocksChange: !!externalBlocks && !!onBlocksChange ? onBlocksChange : undefined
  });

  const { isDualViewMode, blocks, setBlocksWrapper } = useNewsScheduleDualView({
    externalBlocks,
    onBlocksChange,
    internalBlocks
  });
  
  // Item selection
  const {
    selectedMateria,
    selectItem: handleMateriaSelect,
    clearSelection,
    isSelected
  } = useItemSelection();

  // Clipboard functionality - usando hook global
  const { copiedMateria, copyMateria, clearClipboard, hasCopiedMateria } = useClipboard();
  
  // Enhanced paste functionality with optimistic updates
  const { pasteMateria } = usePasteMateria({
    blocks,
    setBlocks: setBlocksWrapper,
    selectedMateria,
    copiedMateria,
    clearClipboard
  });

  // Actions handlers
  const {
    handleViewTeleprompter,
    handleDragEndWithLogging,
    handleSaveModel,
    handleUseModel,
    handleModelApplied,
    handleViewSavedModels
  } = useNewsScheduleActions({
    selectedJournal,
    currentTelejornal,
    blocks,
    journalPrefix,
    openTeleprompter,
    handleDragEnd,
    onSetSaveModelModalOpen: setIsSaveModelModalOpen,
    onSetSavedModelsModalOpen: setIsSavedModelsModalOpen
  });

  // Enhanced keyboard shortcuts with better paste handling
  useKeyboardShortcuts({
    selectedMateria,
    onCopy: copyMateria,
    onPaste: pasteMateria,
    isEspelhoOpen: !!currentTelejornal?.espelho_aberto
  });

  return children({
    // State
    blocks,
    totalJournalTime,
    isLoading,
    isCreatingFirstBlock,
    newItemBlock,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    renumberConfirmOpen,
    setRenumberConfirmOpen,
    isDeleting,
    selectedMateria,
    isSaveModelModalOpen,
    setIsSaveModelModalOpen,
    isSavedModelsModalOpen,
    setIsSavedModelsModalOpen,
    
    // Handlers
    handleAddItem,
    handleDuplicateItem,
    handleDeleteMateria,
    confirmDeleteMateria,
    handleBatchDeleteMaterias,
    handleRenumberItems,
    confirmRenumberItems,
    handleAddFirstBlock,
    handleAddBlock,
    handleRenameBlock,
    handleDeleteBlock,
    handleDragEndWithLogging,
    handleViewTeleprompter,
    handleSaveModel,
    handleUseModel,
    handleModelApplied,
    handleViewSavedModels,
    handleMateriaSelect,
    
    // Clipboard functionality
    copyMateria,
    pasteMateria,
    hasCopiedMateria,
    
    // Other props
    isDualViewMode,
    selectedJournal,
    currentTelejornal,
    journalPrefix
  });
};
