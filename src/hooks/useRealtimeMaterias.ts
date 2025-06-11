
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Materia, Bloco } from "@/types";
import { processUpdatedMateria, calculateBlockTotalTime } from "@/components/news-schedule/utils";

type BlockWithItems = Bloco & { 
  items: Materia[];
  totalTime: number;
};

interface UseRealtimeMateriasProps {
  selectedJournal: string | null;
  newItemBlock: string | null;
  materiaToDelete: Materia | null;
}

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
  
  // Setup realtime subscription for materias updates
  useEffect(() => {
    if (!selectedJournal) {
      console.log('Realtime materias disabled (dual view mode or no journal selected)');
      return;
    }
    
    console.log('Setting up standard realtime subscription for materias table');
    
    const handleMateriaUpdate = (updatedMateria: Materia) => {
      console.log('Processing standard materia update:', updatedMateria);
      
      setBlocks(currentBlocks => {
        // Create new blocks array to ensure React detects the state change
        return currentBlocks.map(block => {
          // Find the block that contains this materia
          if (block.id === updatedMateria.bloco_id) {
            // Find if the materia already exists in this block
            const itemExists = block.items.some(item => item.id === updatedMateria.id);
            
            let updatedItems;
            if (itemExists) {
              // Update the existing materia
              updatedItems = block.items.map(item => 
                item.id === updatedMateria.id 
                  ? processUpdatedMateria(updatedMateria)
                  : item
              );
            } else {
              // This is a new materia for this block
              updatedItems = [...block.items, processUpdatedMateria(updatedMateria)];
            }
            
            // Calculate new total time
            const totalTime = calculateBlockTotalTime(updatedItems);
            
            // Return updated block
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
        handleMateriaUpdate(updatedMateria);
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
          handleMateriaUpdate(newMateria);
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'materias'
      }, (payload) => {
        console.log('Standard materia deleted:', payload);
        const deletedMateria = payload.old as Materia;
        
        // Only process if this was not triggered by the current client
        if (!materiaToDelete || materiaToDelete.id !== deletedMateria.id) {
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
        }
      })
      .subscribe((status) => {
        console.log('Standard realtime subscription status for materias:', status);
      });
    
    // Clean up subscription on unmount or when selectedJournal changes
    return () => {
      console.log('Cleaning up standard realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [selectedJournal, newItemBlock, materiaToDelete]);

  return {
    blocks,
    setBlocks
  };
};
