
import { useState, useEffect } from "react";
import { BlockWithItems, UseRealtimeMateriasProps } from "./types";
import { useSubscriptionHandlers } from "./subscriptionHandlers";

/**
 * Custom hook to handle realtime subscriptions for materias
 * Note: This hook is disabled when selectedJournal is null (dual view mode)
 */
export const useRealtimeMaterias = ({
  selectedJournal,
  newItemBlock,
  materiaToDelete
}: UseRealtimeMateriasProps) => {
  const [blocks, setBlocks] = useState<BlockWithItems[]>([]);
  
  const { setupRealtimeSubscription } = useSubscriptionHandlers(
    selectedJournal,
    newItemBlock,
    materiaToDelete,
    setBlocks
  );
  
  // Setup realtime subscription for materias updates
  useEffect(() => {
    return setupRealtimeSubscription();
  }, [selectedJournal, newItemBlock, materiaToDelete]);

  return {
    blocks,
    setBlocks
  };
};
