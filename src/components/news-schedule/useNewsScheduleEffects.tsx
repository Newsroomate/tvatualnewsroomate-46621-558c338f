
import { useEffect } from "react";
import { fetchBlocosByTelejornal, fetchMateriasByBloco } from "@/services/api";

interface UseNewsScheduleEffectsProps {
  selectedJournal: string | null;
  currentTelejornal: any;
  telejornaisQuery: any;
  blockCreationAttempted: boolean;
  setBlockCreationAttempted: (value: boolean) => void;
  setTotalJournalTime: (value: number) => void;
  blocks: any[];
  setBlocks: (blocks: any[]) => void;
  blockManagement: any;
  teleprompterWindow: any;
}

export const useNewsScheduleEffects = ({
  selectedJournal,
  currentTelejornal,
  telejornaisQuery,
  blockCreationAttempted,
  setBlockCreationAttempted,
  setTotalJournalTime,
  blocks,
  setBlocks,
  blockManagement,
  teleprompterWindow
}: UseNewsScheduleEffectsProps) => {
  // Process blocks data when it changes
  useEffect(() => {
    if (!telejornaisQuery.data || !selectedJournal) return;
    
    const loadBlocos = async () => {
      try {
        const blocosComItems = await Promise.all(
          telejornaisQuery.data.map(async (bloco) => {
            const materias = await fetchMateriasByBloco(bloco.id);
            const totalTime = materias.reduce((sum, item) => sum + item.duracao, 0);
            return {
              ...bloco,
              items: materias,
              totalTime
            };
          })
        );
        
        setBlocks(blocosComItems);
        setBlockCreationAttempted(true);
      } catch (error) {
        console.error("Erro ao carregar blocos e matérias:", error);
      }
    };
    
    loadBlocos();
  }, [telejornaisQuery.data, selectedJournal, setBlocks, setBlockCreationAttempted]);

  // Handle auto-creation of first block with last block data
  useEffect(() => {
    if (!selectedJournal || !currentTelejornal?.espelho_aberto || blockManagement.blockCreationInProgress.current || blockManagement.isCreatingFirstBlock) {
      return;
    }
    
    if (!telejornaisQuery.data || !blockCreationAttempted) {
      return;
    }

    const createInitialBlockWithLastData = async () => {
      if (telejornaisQuery.data.length === 0 && !blockManagement.blockCreationInProgress.current) {
        blockManagement.setIsCreatingFirstBlock(true);
        blockManagement.blockCreationInProgress.current = true;
        
        console.log("Criando bloco inicial com dados do último bloco para telejornal:", selectedJournal);
        
        try {
          await blockManagement.handleAddFirstBlock();
        } catch (error) {
          console.error("Erro ao criar o bloco inicial:", error);
        } finally {
          blockManagement.blockCreationInProgress.current = false;
          blockManagement.setIsCreatingFirstBlock(false);
        }
      }
    };
    
    createInitialBlockWithLastData();
  }, [selectedJournal, currentTelejornal?.espelho_aberto, telejornaisQuery.data, blockCreationAttempted, blockManagement]);

  // Recalculate total journal time when blocks change
  useEffect(() => {
    const total = blocks.reduce((sum, block) => sum + block.totalTime, 0);
    setTotalJournalTime(total);
  }, [blocks, setTotalJournalTime]);

  // Update teleprompter data when blocks change
  useEffect(() => {
    console.log("Blocks changed, updating teleprompter:", blocks);
    teleprompterWindow.updateTeleprompterData(blocks);
  }, [blocks, teleprompterWindow]);
};
