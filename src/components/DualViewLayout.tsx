
import { useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { NewsSchedule } from "./news-schedule/NewsSchedule";
import { Telejornal, Materia } from "@/types";

interface DualViewLayoutProps {
  primaryJournal: string;
  secondaryJournal: string;
  onEditItem: (item: Materia) => void;
  primaryTelejornal: Telejornal | null;
  secondaryTelejornal: Telejornal | null;
  onOpenRundown: () => void;
}

export const DualViewLayout = ({
  primaryJournal,
  secondaryJournal,
  onEditItem,
  primaryTelejornal,
  secondaryTelejornal,
  onOpenRundown
}: DualViewLayoutProps) => {
  return (
    <ResizablePanelGroup direction="vertical" className="h-full">
      <ResizablePanel defaultSize={50} minSize={20}>
        <div className="h-full border-b">
          <div className="bg-blue-50 p-2 border-b">
            <h3 className="text-sm font-medium text-blue-800">
              {primaryTelejornal?.nome || "Telejornal Principal"}
            </h3>
          </div>
          <NewsSchedule
            selectedJournal={primaryJournal}
            onEditItem={onEditItem}
            currentTelejornal={primaryTelejornal}
            onOpenRundown={onOpenRundown}
            journalPrefix="primary"
          />
        </div>
      </ResizablePanel>
      
      <ResizableHandle withHandle />
      
      <ResizablePanel defaultSize={50} minSize={20}>
        <div className="h-full">
          <div className="bg-green-50 p-2 border-b">
            <h3 className="text-sm font-medium text-green-800">
              {secondaryTelejornal?.nome || "Telejornal Secundário"}
            </h3>
          </div>
          <NewsSchedule
            selectedJournal={secondaryJournal}
            onEditItem={onEditItem}
            currentTelejornal={secondaryTelejornal}
            onOpenRundown={onOpenRundown}
            journalPrefix="secondary"
          />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
