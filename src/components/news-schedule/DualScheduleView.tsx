
import { useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Materia, Telejornal } from "@/types";
import { NewsSchedule } from "./NewsSchedule";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { updateMateria } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface DualScheduleViewProps {
  primaryJournalId: string;
  secondaryJournalId: string;
  primaryTelejornal: Telejornal | null;
  secondaryTelejornal: Telejornal | null;
  onEditItem: (materia: Materia) => void;
  onOpenRundown: () => void;
}

export const DualScheduleView = ({
  primaryJournalId,
  secondaryJournalId,
  primaryTelejornal,
  secondaryTelejornal,
  onEditItem,
  onOpenRundown
}: DualScheduleViewProps) => {
  const { toast } = useToast();

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    
    if (!destination) return;
    
    // Check if dragging between different journals
    const sourceJournalId = source.droppableId.includes(primaryJournalId) ? primaryJournalId : secondaryJournalId;
    const destJournalId = destination.droppableId.includes(primaryJournalId) ? primaryJournalId : secondaryJournalId;
    
    // If moving between different journals
    if (sourceJournalId !== destJournalId) {
      try {
        // Extract the block ID from the droppable ID
        const destBlockId = destination.droppableId;
        
        // Update the materia to move it to the target journal's block
        await updateMateria(draggableId, {
          bloco_id: destBlockId
        });
        
        toast({
          title: "Matéria transferida",
          description: `Matéria movida entre telejornais com sucesso`,
          variant: "default"
        });
        
      } catch (error) {
        console.error("Error transferring materia:", error);
        toast({
          title: "Erro na transferência",
          description: "Não foi possível transferir a matéria entre jornais",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <ResizablePanelGroup direction="vertical" className="h-full">
        <ResizablePanel defaultSize={50} minSize={20}>
          <div className="h-full flex flex-col">
            <div className="bg-blue-50 px-4 py-2 border-b">
              <h3 className="font-medium text-blue-900">
                {primaryTelejornal?.nome || 'Telejornal Principal'}
              </h3>
            </div>
            <div className="flex-1 overflow-hidden">
              <NewsSchedule
                selectedJournal={primaryJournalId}
                onEditItem={onEditItem}
                currentTelejornal={primaryTelejornal}
                onOpenRundown={onOpenRundown}
              />
            </div>
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={50} minSize={20}>
          <div className="h-full flex flex-col">
            <div className="bg-green-50 px-4 py-2 border-b">
              <h3 className="font-medium text-green-900">
                {secondaryTelejornal?.nome || 'Telejornal Secundário'}
              </h3>
            </div>
            <div className="flex-1 overflow-hidden">
              <NewsSchedule
                selectedJournal={secondaryJournalId}
                onEditItem={onEditItem}
                currentTelejornal={secondaryTelejornal}
                onOpenRundown={onOpenRundown}
              />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </DragDropContext>
  );
};
