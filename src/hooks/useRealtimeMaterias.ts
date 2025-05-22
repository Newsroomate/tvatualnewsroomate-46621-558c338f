
import { useState, useEffect } from "react";
import { Materia, Bloco } from "@/types";
import { BlockWithItems } from "./useRealtimeMaterias/utils";
import { useDragTracker } from "./useRealtimeMaterias/useDragTracker";
import { useRealtimeSubscription } from "./useRealtimeMaterias/useRealtimeSubscription";
import { createMateriaOperations } from "./useRealtimeMaterias/materiaOperations";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  
  // Use enhanced drag tracking hook
  const {
    startDragging,
    endDragging,
    trackDragOperation,
    shouldIgnoreRealtimeUpdate,
    markItemAsEdited
  } = useDragTracker();
  
  // Create handlers for materia operations
  const {
    handleMateriaUpdate,
    handleMateriaInsert,
    handleMateriaDelete,
    updateExistingMateria
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
  
  // Handle explicit materia editing (for both button click and double-click)
  const handleMateriaEdit = (materia: Materia) => {
    // Mark this item to ignore upcoming realtime updates
    markItemAsEdited(materia.id);
    
    // Update the UI immediately after edit
    setTimeout(() => {
      setBlocks(currentBlocks => {
        return updateExistingMateria(currentBlocks, materia);
      });
    }, 500);
  };
  
  return {
    blocks,
    setBlocks,
    startDragging,
    endDragging,
    trackDragOperation,
    handleMateriaEdit
  };
};
