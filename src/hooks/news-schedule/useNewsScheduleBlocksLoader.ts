
import { useEffect } from "react";
import { fetchMateriasByBloco } from "@/services/api";
import { Bloco, Materia } from "@/types";

type BlockWithItems = Bloco & { 
  items: Materia[];
  totalTime: number;
};

interface UseNewsScheduleBlocksLoaderProps {
  isDualView: boolean;
  blocosQuery: { data?: Bloco[] };
  selectedJournal: string | null;
  setRealtimeBlocks: React.Dispatch<React.SetStateAction<BlockWithItems[]>>;
  setBlockCreationAttempted: (attempted: boolean) => void;
}

export const useNewsScheduleBlocksLoader = ({
  isDualView,
  blocosQuery,
  selectedJournal,
  setRealtimeBlocks,
  setBlockCreationAttempted
}: UseNewsScheduleBlocksLoaderProps) => {
  // Process blocks data when it changes (only for non-dual view)
  useEffect(() => {
    if (isDualView || !blocosQuery.data || !selectedJournal) return;
    
    const loadBlocos = async () => {
      try {
        const blocosComItems = await Promise.all(
          blocosQuery.data.map(async (bloco) => {
            const materias = await fetchMateriasByBloco(bloco.id);
            const totalTime = materias.reduce((sum, item) => sum + item.duracao, 0);
            return {
              ...bloco,
              items: materias,
              totalTime
            };
          })
        );
        
        setRealtimeBlocks(blocosComItems);
        setBlockCreationAttempted(true);
      } catch (error) {
        console.error("Erro ao carregar blocos e matérias:", error);
      }
    };
    
    loadBlocos();
  }, [blocosQuery.data, selectedJournal, setRealtimeBlocks, isDualView, setBlockCreationAttempted]);
};
