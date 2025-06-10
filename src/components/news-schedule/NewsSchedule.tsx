
import { useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { Bloco, Materia, Telejornal } from "@/types";
import { ConfirmationDialogs } from "./ConfirmationDialogs";
import { NewsScheduleHeader } from "./NewsScheduleHeader";
import { NewsScheduleContent } from "./NewsScheduleContent";
import { NewsScheduleModals } from "./NewsScheduleModals";
import { useNewsSchedule } from "@/hooks/useNewsSchedule";
import { useEnhancedHandlers } from "@/hooks/useEnhancedHandlers";
import { useScrollUtils } from "@/hooks/useScrollUtils";

type BlockWithItems = Bloco & { 
  items: Materia[];
  totalTime: number;
};

interface NewsScheduleProps {
  selectedJournal: string | null;
  onEditItem: (Materia) => void;
  currentTelejornal: Telejornal | null;
  onOpenRundown: () => void;
  journalPrefix?: string;
  externalBlocks?: BlockWithItems[];
  onBlocksChange?: (blocks: BlockWithItems[]) => void;
  isDualView?: boolean;
}

export const NewsSchedule = ({ 
  selectedJournal, 
  onEditItem, 
  currentTelejornal, 
  onOpenRundown,
  journalPrefix = "default",
  externalBlocks,
  onBlocksChange,
  isDualView = false
}: NewsScheduleProps) => {
  const isDualViewMode = !!externalBlocks && !!onBlocksChange;
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
    handlePasteMaterias
  } = useNewsSchedule({ 
    selectedJournal, 
    currentTelejornal, 
    onEditItem,
    externalBlocks: isDualViewMode ? externalBlocks : undefined,
    onBlocksChange: isDualViewMode ? onBlocksChange : undefined
  });

  // Use external blocks in dual view mode, otherwise use internal blocks
  const blocks = isDualViewMode ? externalBlocks : internalBlocks;
  
  const { scrollContainerRef, scrollToBottom, scrollToBlock } = useScrollUtils();

  const {
    handleAddBlockWithScroll,
    handleAddFirstBlockWithScroll,
    handleAddItemWithScroll
  } = useEnhancedHandlers({
    blocks,
    handleAddBlock,
    handleAddFirstBlock,
    handleAddItem,
    scrollToBottom,
    scrollToBlock
  });

  const handleViewTeleprompter = () => {
    console.log(`[${journalPrefix}] Opening teleprompter with blocks:`, blocks);
    openTeleprompter(blocks, currentTelejornal);
  };

  const handleDragEndWithLogging = (result: any) => {
    console.log(`[${journalPrefix}] Handling drag end:`, result);
    handleDragEnd(result);
  };

  const scheduleContent = (
    <>
      <NewsScheduleHeader
        currentTelejornal={currentTelejornal}
        totalJournalTime={totalJournalTime}
        blocks={blocks}
        onRenumberItems={handleRenumberItems}
        onAddBlock={handleAddBlockWithScroll}
        onViewTeleprompter={handleViewTeleprompter}
        onSaveModel={() => setIsSaveModelModalOpen(true)}
        onViewSavedModels={() => setIsSavedModelsModalOpen(true)}
      />

      <NewsScheduleContent
        selectedJournal={selectedJournal}
        currentTelejornal={currentTelejornal}
        blocks={blocks}
        isLoading={isLoading}
        isCreatingFirstBlock={isCreatingFirstBlock}
        newItemBlock={newItemBlock}
        onOpenRundown={onOpenRundown}
        onAddFirstBlock={handleAddFirstBlockWithScroll}
        onAddBlock={handleAddBlockWithScroll}
        onAddItem={handleAddItemWithScroll}
        onEditItem={onEditItem}
        onDeleteItem={handleDeleteMateria}
        onDuplicateItem={handleDuplicateItem}
        onRenameBlock={handleRenameBlock}
        onDeleteBlock={handleDeleteBlock}
        journalPrefix={journalPrefix}
        onBatchDeleteItems={handleBatchDeleteMaterias}
        isDeleting={isDeleting}
        onPasteMaterias={handlePasteMaterias}
      />

      <ConfirmationDialogs
        deleteConfirmOpen={deleteConfirmOpen}
        setDeleteConfirmOpen={setDeleteConfirmOpen}
        renumberConfirmOpen={renumberConfirmOpen}
        setRenumberConfirmOpen={setRenumberConfirmOpen}
        confirmDeleteMateria={confirmDeleteMateria}
        confirmRenumberItems={confirmRenumberItems}
      />

      <NewsScheduleModals
        selectedJournal={selectedJournal}
        isSaveModelModalOpen={isSaveModelModalOpen}
        setIsSaveModelModalOpen={setIsSaveModelModalOpen}
        isSavedModelsModalOpen={isSavedModelsModalOpen}
        setIsSavedModelsModalOpen={setIsSavedModelsModalOpen}
      />
    </>
  );

  return (
    <div className="flex flex-col h-full">
      {isDualView ? (
        // In dual view, don't wrap with DragDropContext as it's handled by DualViewLayout
        scheduleContent
      ) : (
        // In single view, wrap with DragDropContext for internal drag and drop
        <DragDropContext onDragEnd={handleDragEndWithLogging}>
          {scheduleContent}
        </DragDropContext>
      )}
    </div>
  );
};
