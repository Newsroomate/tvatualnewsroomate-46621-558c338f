
import { useEffect } from "react";
import { Bloco, Materia, Telejornal } from "@/types";
import { fetchMateriasByBloco } from "@/services/api";

interface NewsScheduleEffectsProps {
  selectedJournal: string | null;
  currentTelejornal: Telejornal | null;
  blocosQuery: any;
  blocks: (Bloco & { items: Materia[], totalTime: number })[];
  setBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[], totalTime: number })[]>>;
  setTotalJournalTime: (time: number) => void;
  setBlockCreationAttempted: (attempted: boolean) => void;
  blockCreationAttempted: boolean;
  isCreatingFirstBlock: boolean;
  handleAddFirstBlock: () => Promise<void>;
  blockCreationInProgress: React.MutableRefObject<boolean>;
  setIsCreatingFirstBlock: (creating: boolean) => void;
}

export const NewsScheduleEffects = ({
  selectedJournal,
  currentTelejornal,
  blocosQuery,
  blocks,
  setBlocks,
  setTotalJournalTime,
  setBlockCreationAttempted,
  blockCreationAttempted,
  isCreatingFirstBlock,
  handleAddFirstBlock,
  blockCreationInProgress,
  setIsCreatingFirstBlock
}: NewsScheduleEffectsProps) => {
  // Process blocks data when it changes
  useEffect(() => {
    if (!blocosQuery.data || !selectedJournal) return;
    
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
        
        setBlocks(blocosComItems);
        setBlockCreationAttempted(true);
      } catch (error) {
        console.error("Erro ao carregar blocos e matérias:", error);
      }
    };
    
    loadBlocos();
  }, [blocosQuery.data, selectedJournal, setBlocks, setBlockCreationAttempted]);

  // Handle auto-creation of first block
  useEffect(() => {
    if (!selectedJournal || !currentTelejornal?.espelho_aberto || blockCreationInProgress.current || isCreatingFirstBlock) {
      return;
    }
    
    if (!blocosQuery.data || !blockCreationAttempted) {
      return;
    }

    const createInitialBlock = async () => {
      if (blocosQuery.data.length === 0 && !blockCreationInProgress.current) {
        setIsCreatingFirstBlock(true);
        blockCreationInProgress.current = true;
        
        console.log("Attempting to create initial block for telejornal:", selectedJournal);
        
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
    
    createInitialBlock();
  }, [selectedJournal, currentTelejornal?.espelho_aberto, blocosQuery.data, blockCreationAttempted, isCreatingFirstBlock, handleAddFirstBlock, blockCreationInProgress, setIsCreatingFirstBlock]);

  // Recalculate total journal time when blocks change
  useEffect(() => {
    const total = blocks.reduce((sum, block) => sum + block.totalTime, 0);
    setTotalJournalTime(total);
  }, [blocks, setTotalJournalTime]);

  return null;
};
