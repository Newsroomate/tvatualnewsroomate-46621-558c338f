
import { useState, useEffect } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { NewsSchedule } from "./news-schedule/NewsSchedule";
import { Telejornal, Materia, Bloco } from "@/types";
import { useCrossPanelDragAndDrop } from "@/hooks/useCrossPanelDragAndDrop";
import { fetchBlocosByTelejornal, fetchMateriasByBloco } from "@/services/api";
import { calculateBlockTotalTime } from "./news-schedule/utils";
import { useQuery } from "@tanstack/react-query";

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
  const [primaryBlocks, setPrimaryBlocks] = useState<(Bloco & { items: Materia[], totalTime: number })[]>([]);
  const [secondaryBlocks, setSecondaryBlocks] = useState<(Bloco & { items: Materia[], totalTime: number })[]>([]);

  // Fetch primary journal blocks
  const { data: primaryBlocosData } = useQuery({
    queryKey: ['blocos', primaryJournal],
    queryFn: () => fetchBlocosByTelejornal(primaryJournal),
    enabled: !!primaryJournal,
  });

  // Fetch secondary journal blocks
  const { data: secondaryBlocosData } = useQuery({
    queryKey: ['blocos', secondaryJournal],
    queryFn: () => fetchBlocosByTelejornal(secondaryJournal),
    enabled: !!secondaryJournal,
  });

  // Load primary blocks with materias
  useEffect(() => {
    if (primaryBlocosData) {
      const loadBlocosWithMaterias = async () => {
        const blocosWithMaterias = await Promise.all(
          primaryBlocosData.map(async (bloco) => {
            const materias = await fetchMateriasByBloco(bloco.id);
            const totalTime = calculateBlockTotalTime(materias);
            return { ...bloco, items: materias, totalTime };
          })
        );
        setPrimaryBlocks(blocosWithMaterias);
      };
      loadBlocosWithMaterias();
    }
  }, [primaryBlocosData]);

  // Load secondary blocks with materias
  useEffect(() => {
    if (secondaryBlocosData) {
      const loadBlocosWithMaterias = async () => {
        const blocosWithMaterias = await Promise.all(
          secondaryBlocosData.map(async (bloco) => {
            const materias = await fetchMateriasByBloco(bloco.id);
            const totalTime = calculateBlockTotalTime(materias);
            return { ...bloco, items: materias, totalTime };
          })
        );
        setSecondaryBlocks(blocosWithMaterias);
      };
      loadBlocosWithMaterias();
    }
  }, [secondaryBlocosData]);

  const { handleCrossPanelDragEnd } = useCrossPanelDragAndDrop({
    primaryBlocks,
    setPrimaryBlocks,
    secondaryBlocks,
    setSecondaryBlocks,
    primaryJournal,
    secondaryJournal,
    isEspelhoAberto: !!(primaryTelejornal?.espelho_aberto || secondaryTelejornal?.espelho_aberto)
  });

  return (
    <DragDropContext onDragEnd={handleCrossPanelDragEnd}>
      <ResizablePanelGroup direction="vertical" className="h-full">
        <ResizablePanel defaultSize={50} minSize={20}>
          <div className="h-full border-b">
            <div className="bg-blue-50 p-2 border-b">
              <h3 className="text-sm font-medium text-blue-800">
                {primaryTelejornal?.nome || "Telejornal Principal"}
                {primaryTelejornal?.espelho_aberto && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    ABERTO
                  </span>
                )}
              </h3>
            </div>
            <NewsSchedule
              selectedJournal={primaryJournal}
              onEditItem={onEditItem}
              currentTelejornal={primaryTelejornal}
              onOpenRundown={onOpenRundown}
              journalPrefix="primary"
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
                {secondaryTelejornal?.espelho_aberto && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    ABERTO
                  </span>
                )}
              </h3>
            </div>
            <NewsSchedule
              selectedJournal={secondaryJournal}
              onEditItem={onEditItem}
              currentTelejornal={secondaryTelejornal}
              onOpenRundown={onOpenRundown}
              journalPrefix="secondary"
              externalBlocks={secondaryBlocks}
              setExternalBlocks={setSecondaryBlocks}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </DragDropContext>
  );
};
