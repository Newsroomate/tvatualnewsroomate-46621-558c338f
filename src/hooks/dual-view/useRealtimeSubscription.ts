
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Materia, Bloco } from "@/types";

type BlockWithItems = Bloco & { 
  items: Materia[];
  totalTime: number;
};

interface UseRealtimeSubscriptionProps {
  primaryJournalId: string | null;
  secondaryJournalId: string | null;
  updateBlocks: (
    setBlocks: React.Dispatch<React.SetStateAction<BlockWithItems[]>>,
    updatedMateria: Materia,
    sourcePrefix: string
  ) => void;
  removeMateria: (
    setBlocks: React.Dispatch<React.SetStateAction<BlockWithItems[]>>,
    materiaId: string,
    sourcePrefix: string
  ) => void;
  setPrimaryBlocks: React.Dispatch<React.SetStateAction<BlockWithItems[]>>;
  setSecondaryBlocks: React.Dispatch<React.SetStateAction<BlockWithItems[]>>;
}

export const useRealtimeSubscription = ({
  primaryJournalId,
  secondaryJournalId,
  updateBlocks,
  removeMateria,
  setPrimaryBlocks,
  setSecondaryBlocks
}: UseRealtimeSubscriptionProps) => {
  const [lastUpdateSource, setLastUpdateSource] = useState<string | null>(null);
  const processingChanges = useRef(new Set<string>());

  useEffect(() => {
    if (!primaryJournalId && !secondaryJournalId) return;
    
    console.log('Setting up dual view realtime subscription');
    setLastUpdateSource(null);
    
    const channel = supabase
      .channel('dual-view-materias-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'materias',
      }, (payload) => {
        const updatedMateria = payload.new as Materia;
        const changeId = `update-${updatedMateria.id}-${Date.now()}`;
        
        if (processingChanges.current.has(changeId)) {
          return;
        }
        
        processingChanges.current.add(changeId);
        console.log('Dual view - Materia updated via realtime:', updatedMateria.id);
        
        updateBlocks(setPrimaryBlocks, updatedMateria, 'primary');
        updateBlocks(setSecondaryBlocks, updatedMateria, 'secondary');
        
        setLastUpdateSource(`materia-${updatedMateria.id}`);
        
        setTimeout(() => {
          processingChanges.current.delete(changeId);
        }, 1000);
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'materias'
      }, (payload) => {
        const newMateria = payload.new as Materia;
        const changeId = `insert-${newMateria.id}-${Date.now()}`;
        
        if (processingChanges.current.has(changeId)) {
          return;
        }
        
        processingChanges.current.add(changeId);
        console.log('Dual view - Materia inserted:', newMateria.id);
        
        updateBlocks(setPrimaryBlocks, newMateria, 'primary');
        updateBlocks(setSecondaryBlocks, newMateria, 'secondary');
        
        setLastUpdateSource(`materia-${newMateria.id}`);
        
        setTimeout(() => {
          processingChanges.current.delete(changeId);
        }, 1000);
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'materias'
      }, (payload) => {
        const deletedMateria = payload.old as Materia;
        const changeId = `delete-${deletedMateria.id}-${Date.now()}`;
        
        if (processingChanges.current.has(changeId)) {
          return;
        }
        
        processingChanges.current.add(changeId);
        console.log('Dual view - Materia deleted:', deletedMateria.id);
        
        removeMateria(setPrimaryBlocks, deletedMateria.id, 'primary');
        removeMateria(setSecondaryBlocks, deletedMateria.id, 'secondary');
        
        setLastUpdateSource(`materia-${deletedMateria.id}`);
        
        setTimeout(() => {
          processingChanges.current.delete(changeId);
        }, 1000);
      })
      .subscribe((status) => {
        console.log('Dual view realtime subscription status:', status);
      });
    
    return () => {
      console.log('Cleaning up dual view realtime subscription');
      supabase.removeChannel(channel);
      processingChanges.current.clear();
    };
  }, [primaryJournalId, secondaryJournalId, updateBlocks, removeMateria, setPrimaryBlocks, setSecondaryBlocks]);

  return { lastUpdateSource };
};
