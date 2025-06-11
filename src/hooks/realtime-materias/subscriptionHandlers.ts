
import { useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Materia } from "@/types";
import { BlockWithItems } from "./types";
import { materiaHandlers } from "./materiaHandlers";
import { calculateBlockTotalTime } from "@/components/news-schedule/utils";

/**
 * Handles realtime subscription setup and event processing
 */
export const useSubscriptionHandlers = (
  selectedJournal: string | null,
  newItemBlock: string | null,
  materiaToDelete: Materia | null,
  setBlocks: React.Dispatch<React.SetStateAction<BlockWithItems[]>>
) => {
  const processingChanges = useRef(new Set<string>());

  const setupRealtimeSubscription = () => {
    if (!selectedJournal) {
      console.log('Realtime materias disabled (dual view mode or no journal selected)');
      return;
    }
    
    console.log('Setting up standard realtime subscription for materias table');
    
    const handleMateriaUpdate = (updatedMateria: Materia, isInsert = false) => {
      const changeId = `${isInsert ? 'insert' : 'update'}-${updatedMateria.id}-${Date.now()}`;
      
      // Prevent duplicate processing
      if (processingChanges.current.has(changeId)) {
        return;
      }
      
      processingChanges.current.add(changeId);
      console.log(`Processing standard materia ${isInsert ? 'insert' : 'update'}:`, updatedMateria);
      
      setBlocks(currentBlocks => {
        return materiaHandlers.handleMateriaUpdate(currentBlocks, updatedMateria, isInsert);
      });
      
      // Clean up the processing flag after a delay
      setTimeout(() => {
        processingChanges.current.delete(changeId);
      }, 1000);
    };

    const handleMateriaDelete = (deletedMateria: Materia) => {
      // Only process if this was not triggered by the current client
      if (!materiaToDelete || materiaToDelete.id !== deletedMateria.id) {
        const changeId = `delete-${deletedMateria.id}-${Date.now()}`;
        
        if (processingChanges.current.has(changeId)) {
          return;
        }
        
        processingChanges.current.add(changeId);
        
        setBlocks(currentBlocks => 
          currentBlocks.map(block => {
            if (block.id === deletedMateria.bloco_id) {
              const updatedItems = block.items.filter(item => item.id !== deletedMateria.id);
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
        
        setTimeout(() => {
          processingChanges.current.delete(changeId);
        }, 1000);
      }
    };
    
    // Subscribe to all materias changes related to the current telejornal's blocks
    const channel = supabase
      .channel(`standard-materias-changes-${selectedJournal}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'materias',
      }, (payload) => {
        console.log('Standard materia updated via realtime:', payload);
        const updatedMateria = payload.new as Materia;
        handleMateriaUpdate(updatedMateria, false);
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'materias'
      }, (payload) => {
        console.log('Standard materia inserted:', payload);
        const newMateria = payload.new as Materia;
        
        // Only process if this was not triggered by the current client
        if (newItemBlock !== newMateria.bloco_id) {
          handleMateriaUpdate(newMateria, true);
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'materias'
      }, (payload) => {
        console.log('Standard materia deleted:', payload);
        const deletedMateria = payload.old as Materia;
        handleMateriaDelete(deletedMateria);
      })
      .subscribe((status) => {
        console.log('Standard realtime subscription status for materias:', status);
      });
    
    // Clean up subscription on unmount or when selectedJournal changes
    return () => {
      console.log('Cleaning up standard realtime subscription');
      supabase.removeChannel(channel);
      processingChanges.current.clear();
    };
  };

  return { setupRealtimeSubscription };
};
