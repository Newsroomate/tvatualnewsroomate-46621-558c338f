
import { Bloco } from "@/types";
import { useBlockStateManager } from "./dual-view/useBlockStateManager";
import { useRealtimeSubscription } from "./dual-view/useRealtimeSubscription";

type BlockWithItems = Bloco & { 
  items: any[];
  totalTime: number;
};

interface UseDualViewRealtimeProps {
  primaryJournalId: string | null;
  secondaryJournalId: string | null;
}

export const useDualViewRealtime = ({
  primaryJournalId,
  secondaryJournalId
}: UseDualViewRealtimeProps) => {
  const {
    primaryBlocks,
    secondaryBlocks,
    setPrimaryBlocks,
    setSecondaryBlocks,
    updateBlocks,
    removeMateria
  } = useBlockStateManager();

  const { lastUpdateSource } = useRealtimeSubscription({
    primaryJournalId,
    secondaryJournalId,
    updateBlocks,
    removeMateria,
    setPrimaryBlocks,
    setSecondaryBlocks
  });

  return {
    primaryBlocks,
    secondaryBlocks,
    setPrimaryBlocks,
    setSecondaryBlocks,
    lastUpdateSource
  };
};
