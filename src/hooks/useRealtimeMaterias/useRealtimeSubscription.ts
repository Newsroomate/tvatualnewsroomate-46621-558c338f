
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Materia } from "@/types";
import { logger, BlockWithItems } from "./utils";
import { toast } from "@/hooks/use-toast";

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
  // Track active channel to prevent unnecessary resubscriptions
  const activeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  
  // Track subscription status
  const subscriptionStatusRef = useRef<'SUBSCRIBED' | 'CLOSED' | 'TIMED_OUT' | 'CHANNEL_ERROR' | null>(null);
  
  // Connection retry count
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;
  
  // Set up realtime subscription for materias
  useEffect(() => {
    if (!selectedJournal) {
      // Clean up previous subscription if no journal is selected
      if (activeChannelRef.current) {
        logger.info('Cleaning up realtime subscription due to journal change');
        supabase.removeChannel(activeChannelRef.current);
        activeChannelRef.current = null;
        subscriptionStatusRef.current = null;
      }
      return;
    }
    
    // Only set up a new subscription if we don't have an active one
    if (activeChannelRef.current && subscriptionStatusRef.current === 'SUBSCRIBED') {
      logger.debug('Reusing existing subscription - already active');
      return;
    }
    
    logger.info('Setting up realtime subscription for materias table');

    // Clean up any existing channel first to avoid duplicate subscriptions
    if (activeChannelRef.current) {
      logger.debug('Removing previous channel before creating new one');
      supabase.removeChannel(activeChannelRef.current);
      activeChannelRef.current = null;
    }
    
    // Create a unique channel name with the journal ID to avoid conflicts
    const channelName = `materias-changes-${selectedJournal}`;
    
    // Subscribe to all materias changes related to the current telejornal's blocks
    const channel = supabase
      .channel(channelName)
      // Listen for updates
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'materias',
      }, (payload) => {
        logger.info('Materia updated via realtime:', payload);
        const updatedMateria = payload.new as Materia;
        
        try {
          // Check if we should ignore this update
          if (shouldIgnoreRealtimeUpdate(updatedMateria.id)) {
            logger.debug('Skipping realtime update for item due to local editing:', updatedMateria.id);
            return;
          }
          
          // Handle the update with automatic retry if needed
          handleMateriaUpdate(updatedMateria);
        } catch (error) {
          console.error("Error handling materia update:", error);
          // Toast alert for error handling
          toast({
            title: "Erro na atualização",
            description: "Houve um problema ao atualizar uma matéria. Recarregue a página se o problema persistir.",
            variant: "destructive"
          });
        }
      })
      // Listen for inserts
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'materias'
      }, (payload) => {
        logger.info('Materia inserted:', payload);
        const newMateria = payload.new as Materia;
        
        try {
          // Only process if this was not triggered by the current client
          if (newItemBlock !== newMateria.bloco_id) {
            handleMateriaInsert(newMateria);
          }
        } catch (error) {
          console.error("Error handling materia insert:", error);
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
        
        try {
          // Only process if this was not triggered by the current client
          if (!materiaToDelete || materiaToDelete.id !== deletedMateria.id) {
            handleMateriaDelete(deletedMateria);
          }
        } catch (error) {
          console.error("Error handling materia delete:", error);
        }
      })
      .subscribe((status) => {
        logger.info('Realtime subscription status for materias:', status);
        subscriptionStatusRef.current = status as any;
        
        if (status === 'SUBSCRIBED') {
          // Reset retry count on successful connection
          retryCountRef.current = 0;
          logger.info('Realtime subscription established successfully');
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          logger.error(`Realtime subscription error: ${status}`);
          
          // Attempt to reconnect if within retry limits
          if (retryCountRef.current < MAX_RETRIES) {
            retryCountRef.current += 1;
            logger.info(`Attempting reconnection (${retryCountRef.current}/${MAX_RETRIES})...`);
            
            // Give some time before retry
            setTimeout(() => {
              if (activeChannelRef.current === channel) {
                // Only retry if this channel is still the active one
                channel.subscribe();
              }
            }, 2000); // 2 second delay before retry
          } else {
            // Notify user of connection issues
            toast({
              title: "Problema de conexão",
              description: "Não foi possível estabelecer conexão em tempo real. Algumas atualizações podem não aparecer automaticamente.",
              variant: "destructive"
            });
          }
        }
      });
    
    // Store reference to active channel
    activeChannelRef.current = channel;
    
    // Clean up subscription on unmount or when selectedJournal changes
    return () => {
      if (activeChannelRef.current) {
        logger.info('Cleaning up realtime subscription');
        supabase.removeChannel(activeChannelRef.current);
        activeChannelRef.current = null;
        subscriptionStatusRef.current = null;
      }
    };
  }, [
    selectedJournal, 
    shouldIgnoreRealtimeUpdate,
    handleMateriaUpdate,
    handleMateriaInsert,
    handleMateriaDelete
  ]);
  
  // Intentionally exclude some dependency changes to avoid unnecessary resubscriptions
  // newItemBlock and materiaToDelete are handled within the callbacks
};
