
import { DragDropContext } from "@hello-pangea/dnd";
import { Bloco, Materia, Telejornal } from "@/types";
import { ScheduleHeader } from "./ScheduleHeader";
import { ScheduleContent } from "./ScheduleContent";
import { ConfirmationDialogs } from "./ConfirmationDialogs";
import { useNewsSchedule } from "@/hooks/useNewsSchedule";
import { useScrollUtils } from "@/hooks/useScrollUtils";
import { useEnhancedHandlers } from "@/hooks/useEnhancedHandlers";

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
}

export const NewsSchedule = ({ 
  selectedJournal, 
  onEditItem, 
  currentTelejornal, 
  onOpenRundown,
  journalPrefix = "default",
  externalBlocks,
  onBlocksChange
}: NewsScheduleProps) => {
  const isDualView = !!externalBlocks && !!onBlocksChange;
  
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
  } = useNewsSchedule({ 
    selectedJournal, 
    currentTelejornal, 
    onEditItem,
    externalBlocks: isDualView ? externalBlocks : undefined,
    onBlocksChange: isDualView ? onBlocksChange : undefined
  });

  // Use external blocks in dual view mode, otherwise use internal blocks
  const blocks = isDualView ? externalBlocks : internalBlocks;
  
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

  return (
    <div className="flex flex-col h-full">
      {/* Header with journal info and total time */}
      <ScheduleHeader
        currentTelejornal={currentTelejornal}
        totalJournalTime={totalJournalTime}
        onRenumberItems={handleRenumberItems}
        hasBlocks={blocks.length > 0}
        onAddBlock={handleAddBlockWithScroll}
        onViewTeleprompter={handleViewTeleprompter}
        blocks={blocks}
      />

      {/* Main area with blocks */}
      <DragDropContext onDragEnd={handleDragEndWithLogging}>
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-6"
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
          />
        </div>
      </DragDropContext>

      {/* Confirmation Dialogs */}
      <ConfirmationDialogs
        deleteConfirmOpen={deleteConfirmOpen}
        setDeleteConfirmOpen={setDeleteConfirmOpen}
        renumberConfirmOpen={renumberConfirmOpen}
        setRenumberConfirmOpen={setRenumberConfirmOpen}
        confirmDeleteMateria={confirmDeleteMateria}
        confirmRenumberItems={confirmRenumberItems}
      />
    </div>
  );
};
