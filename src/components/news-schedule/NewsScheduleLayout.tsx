
import { DragDropContext } from "@hello-pangea/dnd";
import { ScheduleHeader } from "./ScheduleHeader";
import { ScheduleContent } from "./ScheduleContent";
import { NewsScheduleModals } from "./NewsScheduleModals";
import { Bloco, Materia, Telejornal } from "@/types";

interface NewsScheduleLayoutProps {
  selectedJournal: string | null;
  currentTelejornal: Telejornal | null;
  blocks: (Bloco & { items: Materia[], totalTime: number })[];
  totalJournalTime: number;
  isLoading: boolean;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  onEditItem: (item: Materia) => void;
  onOpenRundown: () => void;
  onDragEnd: any;
  itemManagement: any;
  blockManagement: any;
  scheduleLogic: any;
}

export const NewsScheduleLayout = ({
  selectedJournal,
  currentTelejornal,
  blocks,
  totalJournalTime,
  isLoading,
  scrollContainerRef,
  onEditItem,
  onOpenRundown,
  onDragEnd,
  itemManagement,
  blockManagement,
  scheduleLogic
}: NewsScheduleLayoutProps) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header with journal info and total time */}
      <ScheduleHeader
        currentTelejornal={currentTelejornal}
        totalJournalTime={totalJournalTime}
        onRenumberItems={itemManagement.handleRenumberItems}
        hasBlocks={blocks.length > 0}
        onAddBlock={scheduleLogic.handleAddBlockWithScroll}
        onViewTeleprompter={scheduleLogic.handleViewTeleprompter}
        onExportClipRetranca={scheduleLogic.handleExportClipRetranca}
        blocks={blocks}
      />

      {/* Main area with blocks */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-6"
        >
          <ScheduleContent
            selectedJournal={selectedJournal}
            currentTelejornal={currentTelejornal}
            blocks={blocks}
            isLoading={isLoading}
            isCreatingFirstBlock={blockManagement.isCreatingFirstBlock}
            newItemBlock={itemManagement.newItemBlock}
            onOpenRundown={onOpenRundown}
            onAddFirstBlock={scheduleLogic.handleAddFirstBlockWithScroll}
            onAddBlock={scheduleLogic.handleAddBlockWithScroll}
            onAddItem={scheduleLogic.handleAddItemWithScroll}
            onEditItem={onEditItem}
            onDeleteItem={itemManagement.handleDeleteMateria}
            onDuplicateItem={itemManagement.handleDuplicateItem}
            onRenameBlock={blockManagement.handleRenameBlock}
            onDeleteBlock={blockManagement.handleDeleteBlock}
          />
        </div>
      </DragDropContext>

      {/* Modals */}
      <NewsScheduleModals
        deleteConfirmOpen={itemManagement.deleteConfirmOpen}
        setDeleteConfirmOpen={itemManagement.setDeleteConfirmOpen}
        renumberConfirmOpen={itemManagement.renumberConfirmOpen}
        setRenumberConfirmOpen={itemManagement.setRenumberConfirmOpen}
        confirmDeleteMateria={itemManagement.confirmDeleteMateria}
        confirmRenumberItems={itemManagement.confirmRenumberItems}
      />
    </div>
  );
};
