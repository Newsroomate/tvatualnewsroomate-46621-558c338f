
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
  
  // Advanced tracking for drag operations
  const isDraggingRef = useRef(false);
  const recentlyMovedItemsRef = useRef<Map<string, {timestamp: number, sourceBlock: string, destBlock: string}>>(new Map());
  const dragOperationInProgressRef = useRef<{itemId: string, sourceBlock: string, destBlock: string} | null>(null);
  
  // Function to mark item as being moved by user action
  const startDragging = () => {
    isDraggingRef.current = true;
    console.log('Drag operation started');
  };
  
  // Function to mark that drag operation has completed with enhanced tracking
  const endDragging = (itemId?: string, sourceBlockId?: string, destBlockId?: string) => {
    if (itemId && sourceBlockId && destBlockId) {
      console.log(`Drag operation completed: Item ${itemId} moved from ${sourceBlockId} to ${destBlockId}`);
      
      // Store more context about the move operation
      recentlyMovedItemsRef.current.set(itemId, {
        timestamp: Date.now(),
        sourceBlock: sourceBlockId,
        destBlock: destBlockId
      });
      
      // Set a longer buffer time (5 seconds) for moved items
      setTimeout(() => {
        if (recentlyMovedItemsRef.current.has(itemId)) {
          console.log(`Removing ${itemId} from recently moved items buffer`);
          recentlyMovedItemsRef.current.delete(itemId);
        }
      }, 5000);
    } else {
      console.log('Drag operation completed without item details');
    }
    
    isDraggingRef.current = false;
    dragOperationInProgressRef.current = null;
  };
  
  // Helper function to determine if we should ignore an update from realtime
  const shouldIgnoreRealtimeUpdate = (materia: Materia): boolean => {
    // If we're currently dragging, ignore all updates
    if (isDraggingRef.current) {
      console.log(`Ignoring update for ${materia.id} because drag is in progress`);
      return true;
    }
    
    // Check if this item was recently moved by the user
    if (recentlyMovedItemsRef.current.has(materia.id)) {
      const moveInfo = recentlyMovedItemsRef.current.get(materia.id);
      // Only ignore updates if they appear to be related to our move operation
      // This is a heuristic based on timing and involved blocks
      if (moveInfo && (Date.now() - moveInfo.timestamp < 5000)) {
        console.log(`Ignoring update for recently moved item ${materia.id}`);
        return true;
      }
    }
    
    return false;
  };
  
  // Setup realtime subscription for materias updates
  useEffect(() => {
    if (!selectedJournal) return;
    
    console.log('Setting up realtime subscription for materias table');
    
    const handleMateriaUpdate = (updatedMateria: Materia) => {
      // Skip processing updates for items that were just moved by the user
      if (shouldIgnoreRealtimeUpdate(updatedMateria)) {
        console.log('Skipping realtime update for item due to local editing:', updatedMateria.id);
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
          
          // The item exists and the block hasn't changed (regular update)
          return currentBlocks.map(block => {
            if (block.id === updatedMateria.bloco_id) {
              const updatedItems = block.items.map(item => 
                item.id === updatedMateria.id ? processUpdatedMateria(updatedMateria) : item
              );
              return {
                ...block,
                items: updatedItems,
                totalTime: calculateBlockTotalTime(updatedItems)
              };
            }
            return block;
          });
        } else {
          // This is a new item we haven't seen before
          return currentBlocks.map(block => {
            if (block.id === updatedMateria.bloco_id) {
              const updatedItems = [...block.items, processUpdatedMateria(updatedMateria)];
              updatedItems.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
              return {
                ...block,
                items: updatedItems,
                totalTime: calculateBlockTotalTime(updatedItems)
              };
            }
            return block;
          });
        }
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

  // Track active drag operation with more context
  const trackDragOperation = (itemId: string, sourceBlockId: string, destBlockId: string) => {
    dragOperationInProgressRef.current = { itemId, sourceBlock: sourceBlockId, destBlock: destBlockId };
    console.log(`Tracking drag operation: Item ${itemId} from ${sourceBlockId} to ${destBlockId}`);
  };

  return {
    blocks,
    setBlocks,
    startDragging,
    endDragging,
    trackDragOperation
  };
};
