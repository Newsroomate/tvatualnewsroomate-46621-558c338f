
import { useState, useEffect } from "react";
import { Bloco, Materia } from "@/types";
import { fetchMateriasByBloco } from "@/services/api";
import { supabase } from "@/integrations/supabase/client";
import { calculateBlockTotalTime } from "@/components/news-schedule/utils";

interface UseRealtimeMateriasProps {
  setBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[], totalTime: number })[]>>;
  setTotalJournalTime: React.Dispatch<React.SetStateAction<number>>;
  enabled: boolean;
}

export const useRealtimeMaterias = ({
  setBlocks,
  setTotalJournalTime,
  enabled
}: UseRealtimeMateriasProps) => {
  // Set up realtime subscription for materias table
  useEffect(() => {
    if (!enabled) return;
    
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
          
          try {
            // Handle INSERT events (new materia created)
            if (payload.eventType === 'INSERT') {
              const newMateria = payload.new as Materia;
              
              // Add the new materia to its block
              setBlocks(currentBlocks => {
                const updatedBlocks = currentBlocks.map(block => {
                  if (block.id === newMateria.bloco_id) {
                    // Add the new item and recalculate total time
                    const updatedItems = [...block.items, newMateria];
                    const totalTime = calculateBlockTotalTime(updatedItems);
                    return {
                      ...block,
                      items: updatedItems,
                      totalTime
                    };
                  }
                  return block;
                });
                
                // Update total journal time
                const totalTime = updatedBlocks.reduce((sum, block) => sum + block.totalTime, 0);
                setTotalJournalTime(totalTime);
                
                return updatedBlocks;
              });
            }
            
            // Handle UPDATE events (materia edited)
            else if (payload.eventType === 'UPDATE') {
              const updatedMateria = payload.new as Materia;
              
              setBlocks(currentBlocks => {
                const updatedBlocks = currentBlocks.map(block => {
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
                        totalTime: calculateBlockTotalTime(updatedItems)
                      };
                    } else {
                      // Just update the materia in place
                      updatedItems[materiaIndex] = updatedMateria;
                      
                      return {
                        ...block,
                        items: updatedItems,
                        totalTime: calculateBlockTotalTime(updatedItems)
                      };
                    }
                  }
                  
                  // If the materia's bloco_id now points to this block, add it
                  if (updatedMateria.bloco_id === block.id) {
                    const updatedItems = [...block.items, updatedMateria];
                    
                    return {
                      ...block,
                      items: updatedItems,
                      totalTime: calculateBlockTotalTime(updatedItems)
                    };
                  }
                  
                  return block;
                });
                
                // Update total journal time
                const totalTime = updatedBlocks.reduce((sum, block) => sum + block.totalTime, 0);
                setTotalJournalTime(totalTime);
                
                return updatedBlocks;
              });
            }
            
            // Handle DELETE events
            else if (payload.eventType === 'DELETE') {
              const deletedMateriaId = payload.old.id;
              
              // Remove the deleted materia from its block
              setBlocks(currentBlocks => {
                const updatedBlocks = currentBlocks.map(block => {
                  const materiaIndex = block.items.findIndex(item => item.id === deletedMateriaId);
                  
                  if (materiaIndex !== -1) {
                    const updatedItems = [...block.items];
                    updatedItems.splice(materiaIndex, 1);
                    
                    return {
                      ...block,
                      items: updatedItems,
                      totalTime: calculateBlockTotalTime(updatedItems)
                    };
                  }
                  
                  return block;
                });
                
                // Update total journal time
                const totalTime = updatedBlocks.reduce((sum, block) => sum + block.totalTime, 0);
                setTotalJournalTime(totalTime);
                
                return updatedBlocks;
              });
            }
          } catch (error) {
            console.error('Error processing realtime update:', error);
          }
        }
      )
      .subscribe();
      
    // Clean up the subscription on unmount or when enabled changes
    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, setBlocks, setTotalJournalTime]);
};
