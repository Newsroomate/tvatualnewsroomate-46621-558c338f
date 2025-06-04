
import { DualViewLayout } from "@/components/DualViewLayout";
import { NewsSchedule } from "@/components/news-schedule/NewsSchedule";
import { Telejornal, Materia } from "@/types";

interface LayoutContentProps {
  isDualViewActive: boolean;
  selectedJournal: string | null;
  secondaryJournal: string | null;
  currentTelejornal: Telejornal | null;
  secondaryTelejornal: Telejornal | null;
  onEditItem: (item: Materia) => void;
  onOpenRundown: () => void;
}

export const LayoutContent = ({
  isDualViewActive,
  selectedJournal,
  secondaryJournal,
  currentTelejornal,
  secondaryTelejornal,
  onEditItem,
  onOpenRundown
}: LayoutContentProps) => {
  if (isDualViewActive && selectedJournal && secondaryJournal) {
    return (
      <DualViewLayout
        primaryJournal={selectedJournal}
        secondaryJournal={secondaryJournal}
        onEditItem={onEditItem}
        primaryTelejornal={currentTelejornal}
        secondaryTelejornal={secondaryTelejornal}
        onOpenRundown={onOpenRundown}
      />
    );
  }

  return (
    <NewsSchedule
      selectedJournal={selectedJournal}
      onEditItem={onEditItem}
      currentTelejornal={currentTelejornal}
      onOpenRundown={onOpenRundown}
    />
  );
};
