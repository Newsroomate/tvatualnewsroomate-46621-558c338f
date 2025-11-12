import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook para invalidar queries automaticamente quando mudanças ocorrem via realtime
 * Garante que a UI sempre reflita o estado mais atual do banco de dados
 */
export const useRealtimeInvalidation = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('Configurando invalidação automática de queries via realtime');

    const channel = supabase
      .channel('global-invalidation')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'telejornais'
      }, (payload) => {
        console.log('Telejornal modificado - invalidando queries:', payload);
        queryClient.invalidateQueries({ queryKey: ['telejornais'] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'blocos'
      }, (payload) => {
        console.log('Bloco modificado - invalidando queries:', payload);
        // Debounce invalidations
        setTimeout(() => {
          if (payload.new && 'telejornal_id' in payload.new) {
            queryClient.invalidateQueries({ queryKey: ['blocos', payload.new.telejornal_id] });
          }
          if (payload.old && 'telejornal_id' in payload.old) {
            queryClient.invalidateQueries({ queryKey: ['blocos', payload.old.telejornal_id] });
          }
        }, 100);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'materias'
      }, (payload) => {
        console.log('Matéria modificada - invalidando queries:', payload);
        // Debounce invalidations
        setTimeout(() => {
          if (payload.new && 'bloco_id' in payload.new) {
            queryClient.invalidateQueries({ queryKey: ['blocos'] });
          }
          if (payload.old && 'bloco_id' in payload.old) {
            queryClient.invalidateQueries({ queryKey: ['blocos'] });
          }
        }, 100);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'espelhos_salvos'
      }, (payload) => {
        console.log('Espelho salvo modificado - invalidando queries:', payload);
        queryClient.invalidateQueries({ queryKey: ['saved-rundowns'] });
      })
      .subscribe((status) => {
        console.log('Status da subscription de invalidação global:', status);
      });

    return () => {
      console.log('Limpando subscription de invalidação global');
      supabase.removeChannel(channel);
    };
  }, []);
};