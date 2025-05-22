
import { useState } from "react";
import { Materia, Bloco } from "@/types";
import { BlockWithItems } from "./useRealtimeMaterias/utils";
import { useDragTracker } from "./useRealtimeMaterias/useDragTracker";
import { useRealtimeSubscription } from "./useRealtimeMaterias/useRealtimeSubscription";
import { createMateriaOperations } from "./useRealtimeMaterias/materiaOperations";

interface UseRealtimeMateriasProps {
  selectedJournal: string | null;
  newItemBlock: string | null;
  materiaToDelete: Materia | null;
}

/**
 * Custom hook to handle realtime subscriptions for materias
 */
export const useRealtimeMaterias = ({
  selectedJournal,
  newItemBlock,
  materiaToDelete
}: UseRealtimeMateriasProps) => {
  const [blocks, setBlocks] = useState<BlockWithItems[]>([]);
  
  // Use drag tracking hook
  const {
    startDragging,
    endDragging,
    trackDragOperation,
    shouldIgnoreRealtimeUpdate
  } = useDragTracker();
  
  // Create handlers for materia operations
  const {
    handleMateriaUpdate,
    handleMateriaInsert,
    handleMateriaDelete
  } = createMateriaOperations(setBlocks);
  
  // Set up realtime subscription
  useRealtimeSubscription({
    selectedJournal,
    newItemBlock,
    materiaToDelete,
    shouldIgnoreRealtimeUpdate,
    handleMateriaUpdate,
    handleMateriaInsert,
    handleMateriaDelete
  });
  
  return {
    blocks,
    setBlocks,
    startDragging,
    endDragging,
    trackDragOperation
  };
};
