
import { useState } from "react";
import { Bloco, Materia, Telejornal } from "@/types";
import { useRealtimeMaterias } from "@/hooks/useRealtimeMaterias";
import { useBlockManagement } from "@/hooks/useBlockManagement";
import { useItemManagement } from "@/hooks/useItemManagement";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { useTeleprompterWindow } from "@/hooks/useTeleprompterWindow";
import {
  useNewsScheduleState,
  useNewsScheduleQueries,
  useNewsScheduleBlocksLoader,
  useNewsScheduleAutoBlock,
  useNewsScheduleEffects
} from "@/hooks/news-schedule";

type BlockWithItems = Bloco & { 
  items: Materia[];
  totalTime: number;
};

interface UseNewsScheduleProps {
  selectedJournal: string | null;
  currentTelejornal: Telejornal | null;
  onEditItem: (materia: Materia) => void;
  externalBlocks?: BlockWithItems[];
  onBlocksChange?: (blocks: BlockWithItems[]) => void;
}

export const useNewsSchedule = ({ 
  selectedJournal, 
  currentTelejornal, 
  onEditItem,
  externalBlocks,
  onBlocksChange
}: UseNewsScheduleProps) => {
  const isDualView = !!externalBlocks && !!onBlocksChange;
  
  const {
    totalJournalTime,
    setTotalJournalTime,
    blockCreationAttempted,
    setBlockCreationAttempted,
    scrollContainerRef
  } = useNewsScheduleState();

  const { isLoading, blocosQuery } = useNewsScheduleQueries({
    selectedJournal,
    isDualView
  });

  // Use realtime updates only for non-dual view mode
  const { blocks: realtimeBlocks, setBlocks: setRealtimeBlocks } = useRealtimeMaterias({
    selectedJournal: isDualView ? null : selectedJournal,
    newItemBlock: null,
    materiaToDelete: null
  });

  // In dual view mode, use external blocks; otherwise use realtime blocks
  const blocks = isDualView ? externalBlocks : realtimeBlocks;
  const setBlocks = isDualView ? onBlocksChange : setRealtimeBlocks;

  useNewsScheduleBlocksLoader({
    isDualView,
    blocosQuery,
    selectedJournal,
    setRealtimeBlocks,
    setBlockCreationAttempted
  });

  // Use the custom hooks for item, block, and drag-drop management
  const { 
    newItemBlock, 
    setNewItemBlock, 
    deleteConfirmOpen, 
    setDeleteConfirmOpen,
    materiaToDelete, 
    setMateriaToDelete,
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
    handlePasteMaterias
  } = useItemManagement({ 
    blocks, 
    setBlocks, 
    currentTelejornal 
  });

  const { 
    isCreatingFirstBlock, 
    setIsCreatingFirstBlock,
    blockCreationInProgress,
    handleAddFirstBlock, 
    handleAddBlock,
    handleRenameBlock,
    handleDeleteBlock
  } = useBlockManagement({ 
    blocks, 
    setBlocks, 
    selectedJournal, 
    currentTelejornal, 
    blocosQuery: isDualView ? { data: [] } : blocosQuery 
  });

  const { 
    isCreatingFirstBlock: autoBlockCreating,
    setIsCreatingFirstBlock: setAutoBlockCreating,
    blockCreationInProgress: autoBlockProgress
  } = useNewsScheduleAutoBlock({
    isDualView,
    selectedJournal,
    currentTelejornal,
    blockCreationAttempted,
    isCreatingFirstBlock,
    blocosQuery,
    handleAddFirstBlock
  });

  const { handleDragEnd } = useDragAndDrop({ 
    blocks, 
    setBlocks, 
    isEspelhoAberto: !!currentTelejornal?.espelho_aberto,
    isDualView
  });
  
  const { 
    openTeleprompter, 
    updateTeleprompterData, 
    closeTeleprompter 
  } = useTeleprompterWindow();

  useNewsScheduleEffects({
    blocks,
    setTotalJournalTime,
    updateTeleprompterData
  });

  return {
    blocks,
    totalJournalTime,
    isLoading,
    isCreatingFirstBlock: autoBlockCreating || isCreatingFirstBlock,
    newItemBlock,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    materiaToDelete,
    renumberConfirmOpen,
    setRenumberConfirmOpen,
    isDeleting,
    scrollContainerRef,
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
    handlePasteMaterias
  };
};
