
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { NewsSchedule } from "./NewsSchedule";
import { Telejornal, Materia } from "@/types";

interface DualScheduleViewProps {
  primaryJournal: string | null;
  secondaryJournal: string | null;
  primaryTelejornal: Telejornal | null;
  secondaryTelejornal: Telejornal | null;
  onEditItem: (item: Materia) => void;
  onOpenRundown: () => void;
  onCrossMoveMateria: (materia: Materia, targetBlockId: string) => Promise<void>;
}

export const DualScheduleView = ({
  primaryJournal,
  secondaryJournal,
  primaryTelejornal,
  secondaryTelejornal,
  onEditItem,
  onOpenRundown,
  onCrossMoveMateria
}: DualScheduleViewProps) => {
  return (
    <ResizablePanelGroup direction="vertical" className="h-full">
      <ResizablePanel defaultSize={50} minSize={20}>
        <div className="h-full border-b border-gray-200">
          <div className="bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 border-b">
            Espelho Principal: {primaryTelejornal?.nome || "Nenhum selecionado"}
          </div>
          <NewsSchedule
            selectedJournal={primaryJournal}
            onEditItem={onEditItem}
            currentTelejornal={primaryTelejornal}
            onOpenRundown={onOpenRundown}
            journalPrefix="primary"
            onCrossMoveMateria={onCrossMoveMateria}
          />
        </div>
      </ResizablePanel>
      
      <ResizableHandle withHandle />
      
      <ResizablePanel defaultSize={50} minSize={20}>
        <div className="h-full">
          <div className="bg-green-50 px-3 py-1 text-sm font-medium text-green-700 border-b">
            Espelho Secundário: {secondaryTelejornal?.nome || "Nenhum selecionado"}
          </div>
          <NewsSchedule
            selectedJournal={secondaryJournal}
            onEditItem={onEditItem}
            currentTelejornal={secondaryTelejornal}
            onOpenRundown={onOpenRundown}
            journalPrefix="secondary"
            onCrossMoveMateria={onCrossMoveMateria}
          />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
