
import { useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { Bloco, Materia, Telejornal } from "@/types";
import { ScheduleHeader } from "./ScheduleHeader";
import { ScheduleContent } from "./ScheduleContent";
import { ConfirmationDialogs } from "./ConfirmationDialogs";
import { NewsScheduleModals } from "./NewsScheduleModals";
import { useNewsSchedule } from "@/hooks/useNewsSchedule";
import { useScrollUtils } from "@/hooks/useScrollUtils";
import { useEnhancedHandlers } from "@/hooks/useEnhancedHandlers";
import { useClipboard } from "@/hooks/useClipboard";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { usePasteMateria } from "@/hooks/usePasteMateria";
import { useNewsScheduleDualView } from "@/hooks/useNewsScheduleDualView";
import { useNewsScheduleActions } from "./NewsScheduleActions";

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
  const [isSaveModelModalOpen, setIsSaveModelModalOpen] = useState(false);
  const [isSavedModelsModalOpen, setIsSavedModelsModalOpen] = useState(false);
  const [selectedMateria, setSelectedMateria] = useState<Materia | null>(null);
  
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
  
  const { scrollContainerRef, scrollToBottom, scrollToBlock } = useScrollUtils();

  // Clipboard functionality
  const { copiedMateria, copyMateria, clearClipboard, hasCopiedMateria } = useClipboard();
  
  // Paste functionality
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

  // Keyboard shortcuts
  useKeyboardShortcuts({
    selectedMateria,
    onCopy: copyMateria,
    onPaste: pasteMateria,
    isEspelhoOpen: !!currentTelejornal?.espelho_aberto
  });

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

  const scheduleContent = (
    <>
      {/* Header with journal info and total time */}
      <ScheduleHeader
        currentTelejornal={currentTelejornal}
        totalJournalTime={totalJournalTime}
        onRenumberItems={handleRenumberItems}
        hasBlocks={blocks.length > 0}
        onAddBlock={handleAddBlockWithScroll}
        onViewTeleprompter={handleViewTeleprompter}
        onSaveModel={handleSaveModel}
        onViewSavedModels={handleViewSavedModels}
        blocks={blocks}
      />

      {/* Main area with blocks - improved scrolling and padding */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 pb-32 space-y-6"
        style={{ 
          scrollBehavior: 'smooth',
          paddingBottom: 'max(8rem, 20vh)' // Responsive bottom padding
        }}
      >
        <ScheduleContent
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
          selectedMateria={selectedMateria}
          onMateriaSelect={setSelectedMateria}
        />
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmationDialogs
        deleteConfirmOpen={deleteConfirmOpen}
        setDeleteConfirmOpen={setDeleteConfirmOpen}
        renumberConfirmOpen={renumberConfirmOpen}
        setRenumberConfirmOpen={setRenumberConfirmOpen}
        confirmDeleteMateria={confirmDeleteMateria}
        confirmRenumberItems={confirmRenumberItems}
      />

      {/* Models Modals */}
      <NewsScheduleModals
        selectedJournal={selectedJournal}
        isSaveModelModalOpen={isSaveModelModalOpen}
        isSavedModelsModalOpen={isSavedModelsModalOpen}
        onCloseSaveModel={() => setIsSaveModelModalOpen(false)}
        onCloseSavedModels={() => setIsSavedModelsModalOpen(false)}
        onUseModel={handleUseModel}
        onModelApplied={handleModelApplied}
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
