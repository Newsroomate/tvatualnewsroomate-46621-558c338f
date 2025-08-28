import { useState } from "react";
import { Bloco, Materia, Telejornal } from "@/types";
import { useNewsSchedule } from "@/hooks/useNewsSchedule";
import { useClipboard } from "@/hooks/useClipboard";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { usePasteMateria } from "@/hooks/paste-materia";
import { usePasteBlock } from "@/hooks/paste-block";
import { useNewsScheduleDualView } from "@/hooks/useNewsScheduleDualView";
import { useNewsScheduleActions } from "./NewsScheduleActions";
import { useItemSelection } from "@/hooks/useItemSelection";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeBlocos } from "@/hooks/useRealtimeBlocos";

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
  const queryClient = useQueryClient();
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
    openTeleprompter,
    focusOnMateria
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

  // Setup realtime subscription for blocos
  useRealtimeBlocos({
    telejornalId: selectedJournal,
    onBlocoUpdate: (updatedBloco: Bloco) => {
      console.log('Bloco atualizado via realtime:', updatedBloco);
      // Invalidar queries para atualizar a UI
      if (selectedJournal) {
        queryClient.invalidateQueries({ queryKey: ['blocos', selectedJournal] });
      }
    },
    onBlocoInsert: (newBloco: Bloco) => {
      console.log('Novo bloco adicionado via realtime:', newBloco);
      if (selectedJournal) {
        queryClient.invalidateQueries({ queryKey: ['blocos', selectedJournal] });
      }
    },
    onBlocoDelete: (blocoId: string) => {
      console.log('Bloco removido via realtime:', blocoId);
      if (selectedJournal) {
        queryClient.invalidateQueries({ queryKey: ['blocos', selectedJournal] });
      }
    }
  });
  
  // Item selection
  const {
    selectedMateria,
    selectItem: handleMateriaSelect,
    clearSelection,
    isSelected
  } = useItemSelection();

  // Clipboard functionality
  const { copiedMateria, copiedBlock, copyMateria, copyBlock, clearClipboard, hasCopiedMateria, hasCopiedBlock } = useClipboard();
  
  // Enhanced paste functionality with optimistic updates
  const { pasteMateria } = usePasteMateria({
    blocks,
    setBlocks: setBlocksWrapper,
    selectedMateria,
    copiedMateria,
    clearClipboard
  });

  // Block paste functionality
  const { pasteBlock } = usePasteBlock({
    selectedJournal,
    currentTelejornal,
    copiedBlock,
    clearClipboard,
    refreshBlocks: () => {
      if (selectedJournal) {
        queryClient.invalidateQueries({ queryKey: ['blocos', selectedJournal] });
      }
    }
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

  // Enhanced keyboard shortcuts - support for both materia and block pasting
  useKeyboardShortcuts({
    selectedMateria,
    onCopy: copyMateria,
    onPaste: pasteMateria,
    isEspelhoOpen: !!currentTelejornal?.espelho_aberto,
    copiedBlock,
    onPasteBlock: pasteBlock
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
    handleFocusInTeleprompter: focusOnMateria,
    
    // Clipboard functionality
    copyMateria,
    copyBlock,
    hasCopiedMateria,
    hasCopiedBlock,
    copiedBlock,
    
    // Other props
    isDualViewMode,
    selectedJournal,
    currentTelejornal,
    journalPrefix
  });
};
