
import { useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { NewsSchedule } from "./news-schedule/NewsSchedule";
import { Telejornal, Materia } from "@/types";
import { useCrossPanelDragAndDrop } from "@/hooks/useCrossPanelDragAndDrop";
import { useRealtimeMaterias } from "@/hooks/useRealtimeMaterias";

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
  // Use separate realtime hooks for each journal
  const { blocks: primaryBlocks, setBlocks: setPrimaryBlocks } = useRealtimeMaterias({
    selectedJournal: primaryJournal,
    newItemBlock: null,
    materiaToDelete: null
  });

  const { blocks: secondaryBlocks, setBlocks: setSecondaryBlocks } = useRealtimeMaterias({
    selectedJournal: secondaryJournal,
    newItemBlock: null,
    materiaToDelete: null
  });

  // Use cross-panel drag and drop hook
  const { handleCrossPanelDragEnd } = useCrossPanelDragAndDrop({
    primaryBlocks,
    secondaryBlocks,
    setPrimaryBlocks,
    setSecondaryBlocks,
    primaryTelejornal,
    secondaryTelejornal
  });

  const handleDragEnd = async (result: any) => {
    // First check if it's a cross-panel drag
    const wasHandled = await handleCrossPanelDragEnd(result);
    
    // If not handled by cross-panel logic, let individual NewsSchedule components handle it
    // This will be handled by their individual drag and drop hooks
    if (!wasHandled) {
      console.log("Regular within-panel drag - will be handled by individual NewsSchedule components");
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
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
              isDualView={true}
              externalBlocks={primaryBlocks}
              setExternalBlocks={setPrimaryBlocks}
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
              isDualView={true}
              externalBlocks={secondaryBlocks}
              setExternalBlocks={setSecondaryBlocks}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </DragDropContext>
  );
};
