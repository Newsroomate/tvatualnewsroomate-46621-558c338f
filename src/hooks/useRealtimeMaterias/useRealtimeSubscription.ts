
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Materia } from "@/types";
import { logger, BlockWithItems } from "./utils";

interface SubscriptionProps {
  selectedJournal: string | null;
  newItemBlock: string | null;
  materiaToDelete: Materia | null;
  shouldIgnoreRealtimeUpdate: (materiaId: string) => boolean;
  handleMateriaUpdate: (updatedMateria: Materia) => void;
  handleMateriaInsert: (newMateria: Materia) => void;
  handleMateriaDelete: (deletedMateria: Materia) => void;
}

export const useRealtimeSubscription = ({
  selectedJournal,
  newItemBlock,
  materiaToDelete,
  shouldIgnoreRealtimeUpdate,
  handleMateriaUpdate,
  handleMateriaInsert,
  handleMateriaDelete
}: SubscriptionProps) => {
  // Set up realtime subscription for materias
  useEffect(() => {
    if (!selectedJournal) return;
    
    logger.info('Setting up realtime subscription for materias table');
    
    // Subscribe to all materias changes related to the current telejornal's blocks
    const channel = supabase
      .channel('public:materias-changes')
      // Listen for updates
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'materias',
      }, (payload) => {
        logger.info('Materia updated via realtime:', payload);
        const updatedMateria = payload.new as Materia;
        
        // Check if we should ignore this update
        if (shouldIgnoreRealtimeUpdate(updatedMateria.id)) {
          logger.debug('Skipping realtime update for item due to local editing:', updatedMateria.id);
          return;
        }
        
        handleMateriaUpdate(updatedMateria);
      })
      // Listen for inserts
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'materias'
      }, (payload) => {
        logger.info('Materia inserted:', payload);
        const newMateria = payload.new as Materia;
        
        // Only process if this was not triggered by the current client
        if (newItemBlock !== newMateria.bloco_id) {
          handleMateriaInsert(newMateria);
        }
      })
      // Listen for deletes
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'materias'
      }, (payload) => {
        logger.info('Materia deleted:', payload);
        const deletedMateria = payload.old as Materia;
        
        // Only process if this was not triggered by the current client
        if (!materiaToDelete || materiaToDelete.id !== deletedMateria.id) {
          handleMateriaDelete(deletedMateria);
        }
      })
      .subscribe((status) => {
        logger.info('Realtime subscription status for materias:', status);
      });
    
    // Clean up subscription on unmount or when selectedJournal changes
    return () => {
      logger.info('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [
    selectedJournal, 
    newItemBlock, 
    materiaToDelete, 
    shouldIgnoreRealtimeUpdate,
    handleMateriaUpdate,
    handleMateriaInsert,
    handleMateriaDelete
  ]);
};
