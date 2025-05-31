
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bloco, Materia, Telejornal } from "@/types";
import { 
  fetchBlocosByTelejornal, 
  fetchMateriasByBloco, 
  createBloco, 
  updateBloco, 
  deleteBloco
} from "@/services/api";
import { useBlockManagement } from "./useBlockManagement";
import { useItemManagement } from "./useItemManagement";
import { useDragAndDrop } from "./useDragAndDrop";
import { useRealtimeMaterias } from "./useRealtimeMaterias";
import { useTeleprompterWindow } from "./useTeleprompterWindow";
import { calculateBlockTotalTime } from "@/components/news-schedule/utils";

interface UseNewsScheduleProps {
  selectedJournal: string | null;
  currentTelejornal: Telejornal | null;
  onEditItem: (item: Materia) => void;
  journalPrefix?: string;
}

export const useNewsSchedule = ({ 
  selectedJournal, 
  currentTelejornal, 
  onEditItem,
  journalPrefix = "default"
}: UseNewsScheduleProps) => {
  const [blocks, setBlocks] = useState<(Bloco & { items: Materia[], totalTime: number })[]>([]);
  const [totalJournalTime, setTotalJournalTime] = useState(0);
  const [isCreatingFirstBlock, setIsCreatingFirstBlock] = useState(false);
  const queryClient = useQueryClient();

  // Fetch blocks data
  const { data: blocosData, isLoading, ...blocosQuery } = useQuery({
    queryKey: ['blocos', selectedJournal],
    queryFn: () => selectedJournal ? fetchBlocosByTelejornal(selectedJournal) : Promise.resolve([]),
    enabled: !!selectedJournal,
  });

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

  // Initialize realtime subscription for materias
  useRealtimeMaterias({
    setBlocks,
    setTotalJournalTime,
    enabled: !!selectedJournal && !!currentTelejornal
  });

  // Hooks for block and item management
  const {
    isCreatingFirstBlock: blockManagementCreating,
    setIsCreatingFirstBlock: setBlockManagementCreating,
    blockCreationInProgress,
    handleAddFirstBlock,
    handleAddBlock,
    handleRenameBlock,
    handleDeleteBlock
  } = useBlockManagement({ 
    blocks, 
    setBlocks, 
    selectedJournal,
    currentTelejornal, 
    blocosQuery: { ...blocosQuery, refetch: blocosQuery.refetch }
  });

  const {
    newItemBlock,
    setNewItemBlock,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    materiaToDelete,
    setMateriaToDelete,
    renumberConfirmOpen,
    setRenumberConfirmOpen,
    handleAddItem,
    handleDuplicateItem,
    handleDeleteMateria,
    confirmDeleteMateria,
    handleRenumberItems,
    confirmRenumberItems
  } = useItemManagement({ 
    blocks, 
    setBlocks, 
    currentTelejornal 
  });

  const { handleDragEnd } = useDragAndDrop({ 
    blocks, 
    setBlocks, 
    isEspelhoAberto: !!currentTelejornal?.espelho_aberto,
    journalPrefix
  });

  const { openTeleprompter } = useTeleprompterWindow();

  return {
    blocks,
    totalJournalTime,
    isLoading,
    isCreatingFirstBlock: blockManagementCreating,
    newItemBlock,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    renumberConfirmOpen,
    setRenumberConfirmOpen,
    handleAddItem,
    handleDuplicateItem,
    handleDeleteMateria,
    confirmDeleteMateria,
    handleRenumberItems,
    confirmRenumberItems,
    handleAddFirstBlock,
    handleAddBlock,
    handleRenameBlock,
    handleDeleteBlock,
    handleDragEnd,
    openTeleprompter
  };
};
