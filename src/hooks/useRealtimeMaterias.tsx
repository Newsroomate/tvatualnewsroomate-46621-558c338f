
import { useState, useEffect } from "react";
import { Bloco, Materia } from "@/types";
import { fetchMateriasByBloco } from "@/services/api";
import { supabase } from "@/integrations/supabase/client";

interface UseRealtimeMateriasProps {
  selectedJournal: string | null;
  newItemBlock: string | null;
  materiaToDelete: Materia | null;
}

export const useRealtimeMaterias = ({
  selectedJournal,
  newItemBlock,
  materiaToDelete
}: UseRealtimeMateriasProps) => {
  const [blocks, setBlocks] = useState<(Bloco & { items: Materia[], totalTime: number })[]>([]);

  // Set up realtime subscription for materias table
  useEffect(() => {
    if (!selectedJournal) return;
    
    const channel = supabase
      .channel('materias-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'materias' 
        }, 
        async (payload) => {
          console.log('Realtime change received:', payload);

          // Only process changes if we have blocks loaded
          if (blocks.length === 0) return;
          
          try {
            // Handle INSERT events (new materia created)
            if (payload.eventType === 'INSERT') {
              const newMateria = payload.new as Materia;
              
              // If we're already in the process of creating this item, skip to avoid duplicate UI updates
              if (newItemBlock === newMateria.bloco_id) {
                console.log('Skipping INSERT event for materia we just created');
                return;
              }
              
              // Add the new materia to its block
              setBlocks(currentBlocks => {
                return currentBlocks.map(block => {
                  if (block.id === newMateria.bloco_id) {
                    // Add the new item and recalculate total time
                    const updatedItems = [...block.items, newMateria];
                    return {
                      ...block,
                      items: updatedItems,
                      totalTime: updatedItems.reduce((sum, item) => sum + item.duracao, 0)
                    };
                  }
                  return block;
                });
              });
            }
            
            // Handle UPDATE events (materia edited)
            else if (payload.eventType === 'UPDATE') {
              const updatedMateria = payload.new as Materia;
              
              setBlocks(currentBlocks => {
                return currentBlocks.map(block => {
                  // Find the materia in any block
                  const materiaIndex = block.items.findIndex(item => item.id === updatedMateria.id);
                  
                  if (materiaIndex !== -1) {
                    // Materia found in this block
                    const updatedItems = [...block.items];
                    
                    // If the bloco_id changed, this item needs to be removed from this block
                    if (updatedMateria.bloco_id !== block.id) {
                      updatedItems.splice(materiaIndex, 1);
                      
                      return {
                        ...block,
                        items: updatedItems,
                        totalTime: updatedItems.reduce((sum, item) => sum + item.duracao, 0)
                      };
                    } else {
                      // Just update the materia in place
                      updatedItems[materiaIndex] = updatedMateria;
                      
                      return {
                        ...block,
                        items: updatedItems,
                        totalTime: updatedItems.reduce((sum, item) => sum + item.duracao, 0)
                      };
                    }
                  }
                  
                  // If the materia's bloco_id now points to this block, add it
                  if (updatedMateria.bloco_id === block.id) {
                    const updatedItems = [...block.items, updatedMateria];
                    
                    return {
                      ...block,
                      items: updatedItems,
                      totalTime: updatedItems.reduce((sum, item) => sum + item.duracao, 0)
                    };
                  }
                  
                  return block;
                });
              });
            }
            
            // Handle DELETE events
            else if (payload.eventType === 'DELETE') {
              const deletedMateriaId = payload.old.id;
              
              // If we're already in the process of deleting this item, skip to avoid duplicate UI updates
              if (materiaToDelete && materiaToDelete.id === deletedMateriaId) {
                console.log('Skipping DELETE event for materia we just deleted');
                return;
              }
              
              // Remove the deleted materia from its block
              setBlocks(currentBlocks => {
                return currentBlocks.map(block => {
                  const materiaIndex = block.items.findIndex(item => item.id === deletedMateriaId);
                  
                  if (materiaIndex !== -1) {
                    const updatedItems = [...block.items];
                    updatedItems.splice(materiaIndex, 1);
                    
                    return {
                      ...block,
                      items: updatedItems,
                      totalTime: updatedItems.reduce((sum, item) => sum + item.duracao, 0)
                    };
                  }
                  
                  return block;
                });
              });
            }
          } catch (error) {
            console.error('Error processing realtime update:', error);
          }
        }
      )
      .subscribe();
      
    // Clean up the subscription on unmount or when selectedJournal changes
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedJournal, blocks, newItemBlock, materiaToDelete]);

  return { blocks, setBlocks };
};
