
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bloco, Materia, Telejornal } from "@/types";
import { 
  fetchBlocosByTelejornal, 
  fetchMateriasByBloco, 
  createBloco, 
  updateBloco, 
  deleteBloco,
  fetchLastBlocoCadastrado
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
  const { data: blocosData, isLoading } = useQuery({
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
    blocks,
    setBlocks,
    setTotalJournalTime,
    enabled: !!selectedJournal && !!currentTelejornal
  });

  // Hooks for block and item management
  const {
    renameDialogOpen,
    setRenameDialogOpen,
    blockToRename,
    setBlockToRename,
    newBlockName,
    setNewBlockName,
    handleRenameBlock,
    confirmRenameBlock,
    handleDeleteBlock
  } = useBlockManagement({ 
    blocks, 
    setBlocks, 
    currentTelejornal, 
    queryClient 
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

  const handleAddFirstBlock = async () => {
    if (!selectedJournal || !currentTelejornal || !currentTelejornal.espelho_aberto) {
      return;
    }

    setIsCreatingFirstBlock(true);
    
    try {
      // Get data from last registered block for initialization
      let initialData = null;
      try {
        initialData = await fetchLastBlocoCadastrado();
        console.log("Last block data found:", initialData);
      } catch (error) {
        console.log("No last block found, will create empty block");
      }

      // Create first block with initial data
      const firstBlock = await createBloco({
        nome: initialData?.nome || "BLOCO 1",
        telejornal_id: selectedJournal,
        ordem: 1
      });

      console.log("First block created:", firstBlock);

      // Refresh blocks data
      queryClient.invalidateQueries({ queryKey: ['blocos', selectedJournal] });
    } catch (error) {
      console.error("Error creating first block:", error);
    } finally {
      setIsCreatingFirstBlock(false);
    }
  };

  const handleAddBlock = async () => {
    if (!selectedJournal || !currentTelejornal || !currentTelejornal.espelho_aberto) {
      return;
    }

    try {
      // Create new block with next ordem
      const newOrder = blocks.length + 1;
      const newBlock = await createBloco({
        nome: `BLOCO ${newOrder}`,
        telejornal_id: selectedJournal,
        ordem: newOrder
      });

      console.log("New block created:", newBlock);

      // Refresh blocks data
      queryClient.invalidateQueries({ queryKey: ['blocos', selectedJournal] });
    } catch (error) {
      console.error("Error creating block:", error);
    }
  };

  return {
    blocks,
    totalJournalTime,
    isLoading,
    isCreatingFirstBlock,
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
