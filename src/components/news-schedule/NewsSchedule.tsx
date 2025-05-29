
import { Bloco, Materia, Telejornal } from "@/types";
import { useNewsScheduleState } from "./useNewsScheduleState";
import { useNewsScheduleEffects } from "./useNewsScheduleEffects";
import { useNewsScheduleLogic } from "./NewsScheduleLogic";
import { NewsScheduleLayout } from "./NewsScheduleLayout";

interface NewsScheduleProps {
  selectedJournal: string | null;
  onEditItem: (Materia) => void;
  currentTelejornal: Telejornal | null;
  onOpenRundown: () => void;
}

export const NewsSchedule = ({ 
  selectedJournal, 
  onEditItem, 
  currentTelejornal, 
  onOpenRundown 
}: NewsScheduleProps) => {
  const state = useNewsScheduleState({
    selectedJournal,
    currentTelejornal
  });

  useNewsScheduleEffects({
    selectedJournal,
    currentTelejornal,
    telejornaisQuery: state.telejornaisQuery,
    blockCreationAttempted: state.blockCreationAttempted,
    setBlockCreationAttempted: state.setBlockCreationAttempted,
    setTotalJournalTime: state.setTotalJournalTime,
    blocks: state.blocks,
    setBlocks: state.setBlocks,
    blockManagement: state.blockManagement,
    teleprompterWindow: state.teleprompterWindow
  });

  const scheduleLogic = useNewsScheduleLogic({
    currentTelejornal,
    blocks: state.blocks,
    scrollContainerRef: state.scrollContainerRef,
    blockManagement: state.blockManagement,
    itemManagement: state.itemManagement,
    teleprompterWindow: state.teleprompterWindow
  });

  return (
    <NewsScheduleLayout
      selectedJournal={selectedJournal}
      currentTelejornal={currentTelejornal}
      blocks={state.blocks}
      totalJournalTime={state.totalJournalTime}
      isLoading={state.isLoading}
      scrollContainerRef={state.scrollContainerRef}
      onEditItem={onEditItem}
      onOpenRundown={onOpenRundown}
      onDragEnd={state.handleDragEnd}
      itemManagement={state.itemManagement}
      blockManagement={state.blockManagement}
      scheduleLogic={scheduleLogic}
    />
  );
};
