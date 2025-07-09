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

  // Clipboard functionality UNIFICADO
  const { 
    copiedMateria, 
    copiedBlock, 
    copyMateria, 
    copyBlock, 
    clearClipboard, 
    hasCopiedMateria, 
    hasCopiedBlock,
    clipboardItem,
    getClipboardInfo 
  } = useClipboard();
  
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

  // FUNÇÃO UNIFICADA DE PASTE - corrige a lógica de priorização
  const handleUnifiedPaste = async () => {
    const clipboardInfo = getClipboardInfo();
    
    if (!clipboardInfo) {
      toast({
        title: "Nada para colar",
        description: "Copie uma matéria ou bloco primeiro",
        variant: "destructive"
      });
      return;
    }

    console.log('=== PASTE UNIFICADO ===', {
      type: clipboardInfo.type,
      item: clipboardInfo.itemName,
      age: Math.round(clipboardInfo.age / 1000) + 's',
      session: clipboardInfo.isOwnSession ? 'própria' : 'externa'
    });

    // Executar paste baseado no tipo do último item copiado
    if (clipboardInfo.type === 'materia') {
      await pasteMateria();
    } else if (clipboardInfo.type === 'block') {
      await pasteBlock();
    }
  };

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

  // Enhanced keyboard shortcuts - CORRIGIDO para usar paste unificado
  useKeyboardShortcuts({
    selectedMateria,
    onCopy: copyMateria,
    onPaste: handleUnifiedPaste, // <- CORREÇÃO PRINCIPAL
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
    
    // Clipboard functionality ATUALIZADO
    copyMateria,
    copyBlock,
    hasCopiedMateria,
    hasCopiedBlock,
    copiedBlock,
    clipboardInfo: getClipboardInfo(), // Info adicional para debugging
    
    // Other props
    isDualViewMode,
    selectedJournal,
    currentTelejornal,
    journalPrefix
  });
};
