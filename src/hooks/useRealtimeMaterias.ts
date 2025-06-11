
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
  const processingChanges = useRef(new Set<string>());
  
  // Helper function to insert materia in correct position based on ordem
  const insertMateriaInOrder = (items: Materia[], newMateria: Materia): Materia[] => {
    const newOrder = newMateria.ordem || 0;
    
    // Sort existing items by order
    const sortedItems = [...items].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    
    // Find the correct position to insert based on order
    const insertIndex = sortedItems.findIndex(item => (item.ordem || 0) > newOrder);
    
    if (insertIndex === -1) {
      // Insert at the end if no item has a higher order
      return [...sortedItems, newMateria];
    } else {
      // Insert at the correct position
      const updatedItems = [...sortedItems];
      updatedItems.splice(insertIndex, 0, newMateria);
      return updatedItems;
    }
  };

  // Helper function to ensure items are always sorted by ordem
  const sortItemsByOrder = (items: Materia[]): Materia[] => {
    return [...items].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  };
  
  // Setup realtime subscription for materias updates
  useEffect(() => {
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
        return currentBlocks.map(block => {
          // Find the block that contains this materia
          if (block.id === updatedMateria.bloco_id) {
            let updatedItems;
            
            if (isInsert) {
              // For inserts, check if the materia already exists (avoid duplicates)
              const itemExists = block.items.some(item => item.id === updatedMateria.id);
              
              if (!itemExists) {
                // Check if this is replacing a temporary item
                const tempMateriaIndex = block.items.findIndex(item => 
                  item.id.toString().startsWith('temp-') && 
                  Math.abs((item.ordem || 0) - (updatedMateria.ordem || 0)) < 0.5
                );
                
                if (tempMateriaIndex !== -1) {
                  // Replace the temporary materia with the real one
                  updatedItems = [...block.items];
                  updatedItems[tempMateriaIndex] = processUpdatedMateria(updatedMateria);
                } else {
                  // Insert the new materia in the correct position based on order
                  updatedItems = insertMateriaInOrder(block.items, processUpdatedMateria(updatedMateria));
                }
                
                // Always sort by order to ensure consistency
                updatedItems = sortItemsByOrder(updatedItems);
              } else {
                updatedItems = block.items;
              }
            } else {
              // For updates, find and update the existing materia
              const itemExists = block.items.some(item => item.id === updatedMateria.id);
              
              if (itemExists) {
                // Update the existing materia and re-sort if ordem changed
                updatedItems = block.items.map(item => 
                  item.id === updatedMateria.id 
                    ? processUpdatedMateria(updatedMateria)
                    : item
                );
                // Ensure items are still sorted by ordem
                updatedItems = sortItemsByOrder(updatedItems);
              } else {
                // This is a new materia for this block (moved from another block)
                updatedItems = insertMateriaInOrder(block.items, processUpdatedMateria(updatedMateria));
              }
            }
            
            // Calculate new total time
            const totalTime = calculateBlockTotalTime(updatedItems);
            
            // Return updated block
            return {
              ...block,
              items: updatedItems,
              totalTime
            };
          } else {
            // Check if this materia was moved FROM this block (for updates)
            if (!isInsert) {
              const materiaIndex = block.items.findIndex(item => item.id === updatedMateria.id);
              if (materiaIndex !== -1) {
                // Remove the materia from this block as it moved to another block
                const updatedItems = block.items.filter(item => item.id !== updatedMateria.id);
                const totalTime = calculateBlockTotalTime(updatedItems);
                
                return {
                  ...block,
                  items: updatedItems,
                  totalTime
                };
              }
            }
          }
          return block;
        });
      });
      
      // Clean up the processing flag after a delay
      setTimeout(() => {
        processingChanges.current.delete(changeId);
      }, 1000);
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
  }, [selectedJournal, newItemBlock, materiaToDelete]);

  return {
    blocks,
    setBlocks
  };
};
