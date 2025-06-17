import { useState } from "react";
import { Bloco, Materia, Telejornal } from "@/types";
import { useNewsSchedule } from "@/hooks/useNewsSchedule";
import { useClipboard } from "@/hooks/useClipboard";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { usePasteMateria } from "@/hooks/paste-materia";
import { usePasteBloco } from "@/hooks/usePasteBloco";
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

  // Clipboard functionality - updated to support blocks
  const { copiedMateria, copiedBloco, copyMateria, clearClipboard, hasCopiedMateria, hasCopiedBloco } = useClipboard();
  
  // Enhanced paste functionality with optimistic updates
  const { pasteMateria } = usePasteMateria({
    blocks,
    setBlocks: setBlocksWrapper,
    selectedMateria,
    copiedMateria,
    clearClipboard
  });

  // Paste bloco functionality
  const { pasteBloco } = usePasteBloco({
    blocks,
    setBlocks: setBlocksWrapper,
    copiedBloco,
    clearClipboard,
    telejornalId: selectedJournal,
    isEspelhoOpen: !!currentTelejornal?.espelho_aberto
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

  // Enhanced keyboard shortcuts - with block paste support
  useKeyboardShortcuts({
    selectedMateria,
    onCopy: copyMateria,
    onPaste: pasteMateria,
    onPasteBloco: pasteBloco,
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
    
    // Other props
    isDualViewMode,
    selectedJournal,
    currentTelejornal,
    journalPrefix
  });
};
