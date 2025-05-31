
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bloco, Materia } from "@/types";
import { fetchBlocosByTelejornal, fetchMateriasByBloco } from "@/services/api";
import { calculateBlockTotalTime } from "@/components/news-schedule/utils";

interface UseBlocksStateProps {
  selectedJournal: string | null;
}

export const useBlocksState = ({ selectedJournal }: UseBlocksStateProps) => {
  const [blocks, setBlocks] = useState<(Bloco & { items: Materia[], totalTime: number })[]>([]);
  const [totalJournalTime, setTotalJournalTime] = useState(0);

  // Fetch blocks data
  const blocosQuery = useQuery({
    queryKey: ['blocos', selectedJournal],
    queryFn: () => selectedJournal ? fetchBlocosByTelejornal(selectedJournal) : Promise.resolve([]),
    enabled: !!selectedJournal,
  });

  const { data: blocosData, isLoading } = blocosQuery;

  // Load blocks with materias when blocosData changes
  useEffect(() => {
    if (blocosData) {
      const loadBlocosWithMaterias = async () => {
        const blocosWithMaterias = await Promise.all(
          blocosData.map(async (bloco) => {
            const materias = await fetchMateriasByBloco(bloco.id);
            const totalTime = calculateBlockTotalTime(materias);
            return { ...bloco, items: materias, totalTime };
          })
        );
        setBlocks(blocosWithMaterias);
        
        // Calculate total journal time
        const totalTime = blocosWithMaterias.reduce((sum, block) => sum + block.totalTime, 0);
        setTotalJournalTime(totalTime);
      };
      loadBlocosWithMaterias();
    }
  }, [blocosData]);

  return {
    blocks,
    setBlocks,
    totalJournalTime,
    setTotalJournalTime,
    isLoading,
    blocosQuery
  };
};
