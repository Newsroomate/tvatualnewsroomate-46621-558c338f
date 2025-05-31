
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  fetchBlocosByTelejornal, 
  fetchMateriasByBloco, 
  fetchTelejornais
} from "@/services/api";
import { Bloco, Materia, Telejornal } from "@/types";
import { useRealtimeMaterias } from "@/hooks/useRealtimeMaterias";
import { useBlockManagement } from "@/hooks/useBlockManagement";
import { useItemManagement } from "@/hooks/useItemManagement";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { useTeleprompterWindow } from "@/hooks/useTeleprompterWindow";

type BlockWithItems = Bloco & { 
  items: Materia[];
  totalTime: number;
};

interface UseNewsScheduleProps {
  selectedJournal: string | null;
  currentTelejornal: Telejornal | null;
  onEditItem: (materia: Materia) => void;
  externalBlocks?: BlockWithItems[];
  onBlocksChange?: (blocks: BlockWithItems[]) => void;
}

export const useNewsSchedule = ({ 
  selectedJournal, 
  currentTelejornal, 
  onEditItem,
  externalBlocks,
  onBlocksChange
}: UseNewsScheduleProps) => {
  const [totalJournalTime, setTotalJournalTime] = useState(0);
  const [blockCreationAttempted, setBlockCreationAttempted] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const isDualView = !!externalBlocks && !!onBlocksChange;
  
  // Fetch telejornais
  const telejornaisQuery = useQuery({
    queryKey: ['telejornais'],
    queryFn: fetchTelejornais,
  });

  // Fetch blocks for the selected journal (only if not in dual view mode)
  const blocosQuery = useQuery({
    queryKey: ['blocos', selectedJournal],
    queryFn: () => selectedJournal ? fetchBlocosByTelejornal(selectedJournal) : Promise.resolve([]),
    enabled: !!selectedJournal && !isDualView,
  });

  // Use realtime updates only for non-dual view mode
  const { blocks: realtimeBlocks, setBlocks: setRealtimeBlocks } = useRealtimeMaterias({
    selectedJournal: isDualView ? null : selectedJournal,
    newItemBlock: null,
    materiaToDelete: null
  });

  // In dual view mode, use external blocks; otherwise use realtime blocks
  const blocks = isDualView ? externalBlocks : realtimeBlocks;
  const setBlocks = isDualView ? onBlocksChange : setRealtimeBlocks;

  // Use the custom hooks for item, block, and drag-drop management
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

  const { 
    isCreatingFirstBlock, 
    setIsCreatingFirstBlock,
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
    blocosQuery: isDualView ? { data: [] } : blocosQuery 
  });

  const { handleDragEnd } = useDragAndDrop({ 
    blocks, 
    setBlocks, 
    isEspelhoAberto: !!currentTelejornal?.espelho_aberto,
    isDualView
  });
  
  const { 
    openTeleprompter, 
    updateTeleprompterData, 
    closeTeleprompter 
  } = useTeleprompterWindow();

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
  }, [blocosQuery.data, selectedJournal, setRealtimeBlocks, isDualView]);

  // Handle auto-creation of first block (only for non-dual view)
  useEffect(() => {
    if (isDualView || !selectedJournal || !currentTelejornal?.espelho_aberto || blockCreationInProgress.current || isCreatingFirstBlock) {
      return;
    }
    
    if (!blocosQuery.data || !blockCreationAttempted) {
      return;
    }

    const createInitialBlockWithLastData = async () => {
      if (blocosQuery.data.length === 0 && !blockCreationInProgress.current) {
        setIsCreatingFirstBlock(true);
        blockCreationInProgress.current = true;
        
        console.log("Criando bloco inicial para telejornal:", selectedJournal);
        
        try {
          await handleAddFirstBlock();
        } catch (error) {
          console.error("Erro ao criar o bloco inicial:", error);
        } finally {
          blockCreationInProgress.current = false;
          setIsCreatingFirstBlock(false);
        }
      }
    };
    
    createInitialBlockWithLastData();
  }, [selectedJournal, currentTelejornal?.espelho_aberto, blocosQuery.data, blockCreationAttempted, isCreatingFirstBlock, handleAddFirstBlock, blockCreationInProgress, isDualView]);

  // Recalculate total journal time when blocks change
  useEffect(() => {
    const total = blocks.reduce((sum, block) => sum + block.totalTime, 0);
    setTotalJournalTime(total);
  }, [blocks]);

  // Update teleprompter data when blocks change
  useEffect(() => {
    console.log("Blocks changed, updating teleprompter:", blocks);
    updateTeleprompterData(blocks);
  }, [blocks, updateTeleprompterData]);

  const isLoading = telejornaisQuery.isLoading || (!isDualView && blocosQuery.isLoading);

  return {
    blocks,
    totalJournalTime,
    isLoading,
    isCreatingFirstBlock,
    newItemBlock,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    materiaToDelete,
    renumberConfirmOpen,
    setRenumberConfirmOpen,
    scrollContainerRef,
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
