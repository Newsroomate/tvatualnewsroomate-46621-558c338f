
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Materia } from "@/types";
import { logger } from "./utils";
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
  // Rastreia canal ativo para evitar reinscrições desnecessárias
  const activeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  
  // Rastreia status da assinatura
  const subscriptionStatusRef = useRef<'SUBSCRIBED' | 'CLOSED' | 'TIMED_OUT' | 'CHANNEL_ERROR' | null>(null);
  
  // Contagem de tentativas de conexão
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;
  
  // Configura assinatura em tempo real para materias
  useEffect(() => {
    if (!selectedJournal) {
      // Limpa assinatura anterior se nenhum jornal estiver selecionado
      if (activeChannelRef.current) {
        logger.info('Cleaning up realtime subscription due to journal change');
        
        try {
          supabase.removeChannel(activeChannelRef.current);
        } catch (error) {
          console.error("Error removing channel:", error);
        }
        
        activeChannelRef.current = null;
        subscriptionStatusRef.current = null;
      }
      return;
    }
    
    // Só configura uma nova assinatura se não tivermos uma ativa
    if (activeChannelRef.current && subscriptionStatusRef.current === 'SUBSCRIBED') {
      logger.debug('Reusing existing subscription - already active');
      return;
    }
    
    logger.info('Setting up realtime subscription for materias table');

    // Limpa qualquer canal existente primeiro para evitar assinaturas duplicadas
    if (activeChannelRef.current) {
      logger.debug('Removing previous channel before creating new one');
      
      try {
        supabase.removeChannel(activeChannelRef.current);
      } catch (error) {
        console.error("Error removing existing channel:", error);
      }
      
      activeChannelRef.current = null;
    }
    
    // Cria um nome de canal único com o ID do jornal para evitar conflitos
    const channelName = `materias-changes-${selectedJournal}-${Date.now()}`;
    
    try {
      // Assina todas as alterações de matérias relacionadas aos blocos do telejornal atual
      const channel = supabase
        .channel(channelName)
        // Escuta atualizações
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'materias',
        }, (payload) => {
          logger.info('Materia updated via realtime:', payload);
          const updatedMateria = payload.new as Materia;
          
          try {
            // Verifica se devemos ignorar esta atualização
            if (shouldIgnoreRealtimeUpdate(updatedMateria.id)) {
              logger.debug('Skipping realtime update for item due to local editing:', updatedMateria.id);
              return;
            }
            
            // Lida com a atualização com repetição automática, se necessário
            handleMateriaUpdate(updatedMateria);
          } catch (error) {
            console.error("Error handling materia update:", error);
            // Toast de alerta para tratamento de erros
            toast({
              title: "Erro na atualização",
              description: "Houve um problema ao atualizar uma matéria. Recarregue a página se o problema persistir.",
              variant: "destructive"
            });
          }
        })
        // Escuta inserções
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'materias'
        }, (payload) => {
          logger.info('Materia inserted:', payload);
          const newMateria = payload.new as Materia;
          
          try {
            // Só processa se isso não foi acionado pelo cliente atual
            if (newItemBlock !== newMateria.bloco_id) {
              handleMateriaInsert(newMateria);
            }
          } catch (error) {
            console.error("Error handling materia insert:", error);
          }
        })
        // Escuta exclusões
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'materias'
        }, (payload) => {
          logger.info('Materia deleted:', payload);
          const deletedMateria = payload.old as Materia;
          
          try {
            // Só processa se isso não foi acionado pelo cliente atual
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
            // Redefine a contagem de tentativas em uma conexão bem-sucedida
            retryCountRef.current = 0;
            logger.info('Realtime subscription established successfully');
          } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
            logger.error(`Realtime subscription error: ${status}`);
            
            // Tenta reconectar se estiver dentro dos limites de tentativas
            if (retryCountRef.current < MAX_RETRIES) {
              retryCountRef.current += 1;
              logger.info(`Attempting reconnection (${retryCountRef.current}/${MAX_RETRIES})...`);
              
              // Dá algum tempo antes de tentar novamente
              setTimeout(() => {
                if (activeChannelRef.current === channel) {
                  // Só tenta novamente se este canal ainda for o ativo
                  channel.subscribe();
                }
              }, 2000); // 2 segundos de atraso antes de tentar novamente
            } else {
              // Notifica o usuário sobre problemas de conexão
              toast({
                title: "Problema de conexão",
                description: "Não foi possível estabelecer conexão em tempo real. Algumas atualizações podem não aparecer automaticamente.",
                variant: "destructive"
              });
            }
          }
        });
      
      // Armazena referência ao canal ativo
      activeChannelRef.current = channel;
    } catch (error) {
      console.error("Error setting up real-time subscription:", error);
      toast({
        title: "Problema de conexão",
        description: "Não foi possível estabelecer conexão em tempo real. Algumas atualizações podem não aparecer automaticamente.",
        variant: "destructive"
      });
    }
    
    // Limpa a assinatura na desmontagem ou quando selectedJournal muda
    return () => {
      if (activeChannelRef.current) {
        logger.info('Cleaning up realtime subscription');
        
        try {
          supabase.removeChannel(activeChannelRef.current);
        } catch (error) {
          console.error("Error removing channel on cleanup:", error);
        }
        
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
  
  // Intencionalmente exclui algumas mudanças de dependência para evitar reinscrições desnecessárias
  // newItemBlock e materiaToDelete são tratados dentro dos callbacks
};
