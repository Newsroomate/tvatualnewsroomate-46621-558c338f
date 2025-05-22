
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
 */
export const useRealtimeMaterias = ({
  selectedJournal,
  newItemBlock,
  materiaToDelete
}: UseRealtimeMateriasProps) => {
  const [blocks, setBlocks] = useState<BlockWithItems[]>([]);
  // Track ongoing drag operations to prevent conflicts with realtime updates
  const isDraggingRef = useRef(false);
  const recentlyMovedItemsRef = useRef<Set<string>>(new Set());
  
  // Function to mark item as being moved by user action
  const startDragging = () => {
    isDraggingRef.current = true;
  };
  
  // Function to mark that drag operation has completed
  const endDragging = (itemId?: string) => {
    if (itemId) {
      recentlyMovedItemsRef.current.add(itemId);
      // Clear the item from recently moved after a short delay
      setTimeout(() => {
        recentlyMovedItemsRef.current.delete(itemId);
      }, 2000); // 2 second buffer to prevent overriding by realtime
    }
    isDraggingRef.current = false;
  };
  
  // Setup realtime subscription for materias updates
  useEffect(() => {
    if (!selectedJournal) return;
    
    console.log('Setting up realtime subscription for materias table');
    
    const handleMateriaUpdate = (updatedMateria: Materia) => {
      // Skip processing updates for items that were just moved by the user
      if (recentlyMovedItemsRef.current.has(updatedMateria.id)) {
        console.log('Skipping realtime update for recently moved item:', updatedMateria.id);
        return;
      }
      
      console.log('Processing materia update:', updatedMateria);
      
      setBlocks(currentBlocks => {
        // Find the source block that contains this materia (if it exists)
        const sourceBlockIndex = currentBlocks.findIndex(block => 
          block.items.some(item => item.id === updatedMateria.id)
        );
        
        // If item doesn't exist or bloco_id has changed, handle as a move operation
        if (sourceBlockIndex !== -1) {
          const sourceBlock = currentBlocks[sourceBlockIndex];
          const sourceItem = sourceBlock.items.find(item => item.id === updatedMateria.id);
          
          // If the bloco_id changed, this is a move operation between blocks
          if (sourceItem && sourceItem.bloco_id !== updatedMateria.bloco_id) {
            console.log(`Item ${updatedMateria.id} moved from block ${sourceItem.bloco_id} to ${updatedMateria.bloco_id}`);
            
            // Create new blocks array to ensure React detects the state change
            return currentBlocks.map(block => {
              // Remove from source block
              if (block.id === sourceItem.bloco_id) {
                const updatedItems = block.items.filter(item => item.id !== updatedMateria.id);
                return {
                  ...block,
                  items: updatedItems,
                  totalTime: calculateBlockTotalTime(updatedItems)
                };
              }
              
              // Add to destination block
              if (block.id === updatedMateria.bloco_id) {
                // Find the correct position based on ordem
                const updatedItems = [...block.items];
                const insertIndex = updatedItems.findIndex(item => 
                  (item.ordem || 0) > (updatedMateria.ordem || 0)
                );
                
                if (insertIndex === -1) {
                  updatedItems.push(processUpdatedMateria(updatedMateria));
                } else {
                  updatedItems.splice(insertIndex, 0, processUpdatedMateria(updatedMateria));
                }
                
                return {
                  ...block,
                  items: updatedItems,
                  totalTime: calculateBlockTotalTime(updatedItems)
                };
              }
              
              return block;
            });
          }
        }
        
        // Default update handling (non-move operations)
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
            
            // Ensure items are sorted by ordem
            updatedItems.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
            
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
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [selectedJournal, newItemBlock, materiaToDelete]);

  return {
    blocks,
    setBlocks,
    startDragging,
    endDragging
  };
};
