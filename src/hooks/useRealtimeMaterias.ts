
import { useState, useEffect } from "react";
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
  blocks: Bloco[];
}

/**
 * Custom hook to handle realtime subscriptions for materias
 */
export const useRealtimeMaterias = ({
  selectedJournal,
  newItemBlock,
  materiaToDelete,
  blocks: rawBlocks
}: UseRealtimeMateriasProps) => {
  const [blocks, setBlocks] = useState<BlockWithItems[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Transform raw blocks into blocks with items whenever raw blocks change
  useEffect(() => {
    if (!rawBlocks.length) {
      setBlocks([]);
      return;
    }
    
    const fetchInitialMaterias = async () => {
      setIsLoading(true);
      
      try {
        // Map each block to a promise that fetches its materias
        const blocksWithItemsPromises = rawBlocks.map(async (block) => {
          const { data, error } = await supabase
            .from('materias')
            .select('*')
            .eq('bloco_id', block.id)
            .order('ordem');
            
          if (error) {
            console.error(`Error fetching materias for block ${block.id}:`, error);
            return {
              ...block,
              items: [],
              totalTime: 0
            };
          }
          
          const items = data.map(processUpdatedMateria);
          const totalTime = calculateBlockTotalTime(items);
          
          return {
            ...block,
            items,
            totalTime
          };
        });
        
        // Wait for all promises to resolve
        const blocksWithItems = await Promise.all(blocksWithItemsPromises);
        setBlocks(blocksWithItems);
      } catch (error) {
        console.error('Exception fetching materias:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialMaterias();
  }, [rawBlocks]);
  
  // Setup realtime subscription for materias updates
  useEffect(() => {
    if (!selectedJournal) return;
    
    console.log('Setting up realtime subscription for materias table');
    
    const handleMateriaUpdate = (updatedMateria: Materia) => {
      console.log('Processing materia update:', updatedMateria);
      
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
      .channel('public:materias-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'materias',
      }, (payload) => {
        console.log('Materia updated via realtime:', payload);
        const updatedMateria = payload.new as Materia;
        handleMateriaUpdate(updatedMateria);
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'materias'
      }, (payload) => {
        console.log('Materia inserted:', payload);
        const newMateria = payload.new as Materia;
        
        // Only process if this was not triggered by the current client
        // (avoids duplicate items when we're the ones who created it)
        if (newItemBlock !== newMateria.bloco_id) {
          handleMateriaUpdate(newMateria);
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'materias'
      }, (payload) => {
        console.log('Materia deleted:', payload);
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
        console.log('Realtime subscription status for materias:', status);
      });
    
    // Clean up subscription on unmount or when selectedJournal changes
    return () => {
      console.log('Cleaning up realtime subscription for materias');
      supabase.removeChannel(channel);
    };
  }, [selectedJournal, newItemBlock, materiaToDelete]);

  return {
    blocks,
    setBlocks,
    isLoading
  };
};
