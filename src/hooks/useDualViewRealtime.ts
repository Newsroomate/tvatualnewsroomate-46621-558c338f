
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Materia, Bloco } from "@/types";
import { fetchMateriasByBloco } from "@/services/api";

type BlockWithItems = Bloco & { 
  items: Materia[];
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
  const [primaryBlocks, setPrimaryBlocks] = useState<BlockWithItems[]>([]);
  const [secondaryBlocks, setSecondaryBlocks] = useState<BlockWithItems[]>([]);
  const [lastUpdateSource, setLastUpdateSource] = useState<string | null>(null);
  
  // Track changes to prevent infinite loops
  const processingChanges = useRef(new Set<string>());

  const calculateBlockTotalTime = (items: Materia[]) => {
    return items.reduce((sum, item) => sum + (item.duracao || 0), 0);
  };

  const processUpdatedMateria = (updatedMateria: Materia): Materia => {
    return {
      ...updatedMateria,
      titulo: updatedMateria.retranca || "Sem título"
    };
  };

  const updateBlocks = (
    setBlocks: React.Dispatch<React.SetStateAction<BlockWithItems[]>>,
    updatedMateria: Materia,
    sourcePrefix: string
  ) => {
    console.log(`[${sourcePrefix}] Processing materia update:`, updatedMateria.id);
    
    setBlocks(currentBlocks => {
      return currentBlocks.map(block => {
        if (block.id === updatedMateria.bloco_id) {
          const itemExists = block.items.some(item => item.id === updatedMateria.id);
          
          let updatedItems;
          if (itemExists) {
            updatedItems = block.items.map(item => 
              item.id === updatedMateria.id 
                ? processUpdatedMateria(updatedMateria)
                : item
            );
          } else {
            updatedItems = [...block.items, processUpdatedMateria(updatedMateria)];
          }
          
          const totalTime = calculateBlockTotalTime(updatedItems);
          
          return {
            ...block,
            items: updatedItems,
            totalTime
          };
        }
        return block;
      });
    });
  };

  const removeMateria = (
    setBlocks: React.Dispatch<React.SetStateAction<BlockWithItems[]>>,
    materiaId: string,
    sourcePrefix: string
  ) => {
    console.log(`[${sourcePrefix}] Removing materia:`, materiaId);
    
    setBlocks(currentBlocks => 
      currentBlocks.map(block => {
        const materiaIndex = block.items.findIndex(item => item.id === materiaId);
        
        if (materiaIndex !== -1) {
          const updatedItems = block.items.filter(item => item.id !== materiaId);
          const totalTime = calculateBlockTotalTime(updatedItems);
          
          return {
            ...block,
            items: updatedItems,
            totalTime
          };
        }
        
        return block;
      })
    );
  };

  // Setup realtime subscription for both journals
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
        
        // Prevent processing the same change multiple times
        if (processingChanges.current.has(changeId)) {
          return;
        }
        
        processingChanges.current.add(changeId);
        console.log('Dual view - Materia updated via realtime:', updatedMateria.id);
        
        // Update both views if they contain this materia's block
        updateBlocks(setPrimaryBlocks, updatedMateria, 'primary');
        updateBlocks(setSecondaryBlocks, updatedMateria, 'secondary');
        
        setLastUpdateSource(`materia-${updatedMateria.id}`);
        
        // Clean up the tracking set after a delay
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
  }, [primaryJournalId, secondaryJournalId]);

  return {
    primaryBlocks,
    secondaryBlocks,
    setPrimaryBlocks,
    setSecondaryBlocks,
    lastUpdateSource
  };
};
