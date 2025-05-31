
import { useState, useEffect } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { NewsSchedule } from "./news-schedule/NewsSchedule";
import { Telejornal, Materia } from "@/types";
import { useDualViewRealtime } from "@/hooks/useDualViewRealtime";
import { useCrossPanelDragAndDrop } from "@/hooks/useCrossPanelDragAndDrop";
import { useQuery } from "@tanstack/react-query";
import { fetchBlocosByTelejornal, fetchMateriasByBloco } from "@/services/api";

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
  const {
    primaryBlocks,
    secondaryBlocks,
    setPrimaryBlocks,
    setSecondaryBlocks,
    lastUpdateSource
  } = useDualViewRealtime({
    primaryJournalId: primaryJournal,
    secondaryJournalId: secondaryJournal
  });

  const { handleCrossPanelDragEnd } = useCrossPanelDragAndDrop({
    primaryBlocks,
    secondaryBlocks,
    setPrimaryBlocks,
    setSecondaryBlocks,
    primaryTelejornal,
    secondaryTelejornal
  });

  // Fetch blocks for primary journal
  const primaryBlocosQuery = useQuery({
    queryKey: ['blocos', primaryJournal],
    queryFn: () => primaryJournal ? fetchBlocosByTelejornal(primaryJournal) : Promise.resolve([]),
    enabled: !!primaryJournal,
  });

  // Fetch blocks for secondary journal
  const secondaryBlocosQuery = useQuery({
    queryKey: ['blocos', secondaryJournal],
    queryFn: () => secondaryJournal ? fetchBlocosByTelejornal(secondaryJournal) : Promise.resolve([]),
    enabled: !!secondaryJournal,
  });

  // Load primary blocks with materias
  useEffect(() => {
    if (!primaryBlocosQuery.data || !primaryJournal) return;
    
    const loadPrimaryBlocos = async () => {
      try {
        const blocosComItems = await Promise.all(
          primaryBlocosQuery.data.map(async (bloco) => {
            const materias = await fetchMateriasByBloco(bloco.id);
            const totalTime = materias.reduce((sum, item) => sum + item.duracao, 0);
            return {
              ...bloco,
              items: materias,
              totalTime
            };
          })
        );
        
        console.log('Loading primary blocks:', blocosComItems);
        setPrimaryBlocks(blocosComItems);
      } catch (error) {
        console.error("Erro ao carregar blocos primários:", error);
      }
    };
    
    loadPrimaryBlocos();
  }, [primaryBlocosQuery.data, primaryJournal, setPrimaryBlocks]);

  // Load secondary blocks with materias
  useEffect(() => {
    if (!secondaryBlocosQuery.data || !secondaryJournal) return;
    
    const loadSecondaryBlocos = async () => {
      try {
        const blocosComItems = await Promise.all(
          secondaryBlocosQuery.data.map(async (bloco) => {
            const materias = await fetchMateriasByBloco(bloco.id);
            const totalTime = materias.reduce((sum, item) => sum + item.duracao, 0);
            return {
              ...bloco,
              items: materias,
              totalTime
            };
          })
        );
        
        console.log('Loading secondary blocks:', blocosComItems);
        setSecondaryBlocks(blocosComItems);
      } catch (error) {
        console.error("Erro ao carregar blocos secundários:", error);
      }
    };
    
    loadSecondaryBlocos();
  }, [secondaryBlocosQuery.data, secondaryJournal, setSecondaryBlocks]);

  // Log sync updates for debugging
  useEffect(() => {
    if (lastUpdateSource) {
      console.log('Dual view sync update from:', lastUpdateSource);
    }
  }, [lastUpdateSource]);

  const handleDragEnd = (result: any) => {
    console.log('Dual view drag end:', result);
    handleCrossPanelDragEnd(result);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <ResizablePanelGroup direction="vertical" className="h-full">
        <ResizablePanel defaultSize={50} minSize={20}>
          <div className="h-full border-b">
            <div className="bg-blue-50 p-2 border-b flex justify-between items-center">
              <h3 className="text-sm font-medium text-blue-800">
                {primaryTelejornal?.nome || "Telejornal Principal"}
              </h3>
              {lastUpdateSource && (
                <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  ↻ Sincronizado
                </div>
              )}
            </div>
            <NewsSchedule
              selectedJournal={primaryJournal}
              onEditItem={onEditItem}
              currentTelejornal={primaryTelejornal}
              onOpenRundown={onOpenRundown}
              journalPrefix="primary"
              externalBlocks={primaryBlocks}
              onBlocksChange={setPrimaryBlocks}
              isDualView={true}
            />
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={50} minSize={20}>
          <div className="h-full">
            <div className="bg-green-50 p-2 border-b flex justify-between items-center">
              <h3 className="text-sm font-medium text-green-800">
                {secondaryTelejornal?.nome || "Telejornal Secundário"}
              </h3>
              {lastUpdateSource && (
                <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                  ↻ Sincronizado
                </div>
              )}
            </div>
            <NewsSchedule
              selectedJournal={secondaryJournal}
              onEditItem={onEditItem}
              currentTelejornal={secondaryTelejornal}
              onOpenRundown={onOpenRundown}
              journalPrefix="secondary"
              externalBlocks={secondaryBlocks}
              onBlocksChange={setSecondaryBlocks}
              isDualView={true}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </DragDropContext>
  );
};
