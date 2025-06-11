
import { useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { Bloco, Materia, Telejornal } from "@/types";
import { ScheduleHeader } from "./ScheduleHeader";
import { ScheduleContent } from "./ScheduleContent";
import { useScrollUtils } from "@/hooks/useScrollUtils";
import { useEnhancedHandlers } from "@/hooks/useEnhancedHandlers";

type BlockWithItems = Bloco & { 
  items: Materia[];
  totalTime: number;
};

interface NewsScheduleCoreProps {
  selectedJournal: string | null;
  onEditItem: (Materia) => void;
  currentTelejornal: Telejornal | null;
  onOpenRundown: () => void;
  journalPrefix?: string;
  blocks: BlockWithItems[];
  totalJournalTime: number;
  isLoading: boolean;
  isCreatingFirstBlock: boolean;
  newItemBlock: string | null;
  isDeleting: boolean;
  selectedMateria: Materia | null;
  onMateriaSelect: (materia: Materia | null) => void;
  // Handler functions
  handleAddItem: (blockId: string) => void;
  handleDuplicateItem: (item: Materia) => void;
  handleDeleteMateria: (item: Materia) => void;
  handleBatchDeleteMaterias: (items: Materia[]) => void;
  handleRenumberItems: () => void;
  handleAddFirstBlock: () => Promise<any>;
  handleAddBlock: () => Promise<any>;
  handleRenameBlock: (blockId: string, newName: string) => void;
  handleDeleteBlock: (blockId: string) => void;
  handleDragEnd: (result: any) => void;
  handleViewTeleprompter: () => void;
  handleSaveModel: () => void;
  handleViewSavedModels: () => void;
  isDualView?: boolean;
  // Clipboard related props
  copyMateria?: (materia: Materia) => void;
  pasteMateria?: () => void;
  hasCopiedMateria?: boolean;
}

export const NewsScheduleCore = ({
  selectedJournal,
  onEditItem,
  currentTelejornal,
  onOpenRundown,
  journalPrefix = "default",
  blocks,
  totalJournalTime,
  isLoading,
  isCreatingFirstBlock,
  newItemBlock,
  isDeleting,
  selectedMateria,
  onMateriaSelect,
  handleAddItem,
  handleDuplicateItem,
  handleDeleteMateria,
  handleBatchDeleteMaterias,
  handleRenumberItems,
  handleAddFirstBlock,
  handleAddBlock,
  handleRenameBlock,
  handleDeleteBlock,
  handleDragEnd,
  handleViewTeleprompter,
  handleSaveModel,
  handleViewSavedModels,
  isDualView = false,
  // Clipboard related props with defaults
  copyMateria = () => {},
  pasteMateria = () => {},
  hasCopiedMateria = false
}: NewsScheduleCoreProps) => {
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
        hasCopiedMateria={hasCopiedMateria}
      />

      {/* Main area with blocks - enhanced scrolling and real-time updates */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 pb-32 space-y-6"
        style={{ 
          scrollBehavior: 'smooth',
          paddingBottom: 'max(8rem, 20vh)'
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
          onMateriaSelect={onMateriaSelect}
          copyMateria={copyMateria}
        />
      </div>
    </>
  );

  return (
    <div className="flex flex-col h-full">
      {isDualView ? (
        // In dual view, don't wrap with DragDropContext as it's handled by DualViewLayout
        scheduleContent
      ) : (
        // In single view, wrap with DragDropContext for internal drag and drop
        <DragDropContext onDragEnd={handleDragEnd}>
          {scheduleContent}
        </DragDropContext>
      )}
    </div>
  );
};
