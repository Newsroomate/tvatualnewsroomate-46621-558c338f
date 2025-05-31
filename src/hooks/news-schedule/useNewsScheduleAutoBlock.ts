
import { useEffect, useRef, useState } from "react";
import { Telejornal, Bloco } from "@/types";

interface UseNewsScheduleAutoBlockProps {
  isDualView: boolean;
  selectedJournal: string | null;
  currentTelejornal: Telejornal | null;
  blockCreationAttempted: boolean;
  isCreatingFirstBlock: boolean;
  blocosQuery: { data?: Bloco[] };
  handleAddFirstBlock: () => Promise<void>;
}

export const useNewsScheduleAutoBlock = ({
  isDualView,
  selectedJournal,
  currentTelejornal,
  blockCreationAttempted,
  isCreatingFirstBlock,
  blocosQuery,
  handleAddFirstBlock
}: UseNewsScheduleAutoBlockProps) => {
  const blockCreationInProgress = useRef(false);
  const [isCreatingFirstBlockState, setIsCreatingFirstBlock] = useState(false);

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
  }, [selectedJournal, currentTelejornal?.espelho_aberto, blocosQuery.data, blockCreationAttempted, isCreatingFirstBlock, handleAddFirstBlock, isDualView]);

  return {
    isCreatingFirstBlock: isCreatingFirstBlockState,
    setIsCreatingFirstBlock,
    blockCreationInProgress
  };
};
