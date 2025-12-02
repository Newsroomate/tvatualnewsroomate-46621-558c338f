import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface UseRealtimePautasProps {
  onPautaChange: () => void;
}

export const useRealtimePautas = ({ onPautaChange }: UseRealtimePautasProps) => {
  useEffect(() => {
    console.log('[useRealtimePautas] Iniciando subscription para pautas gerais');

    // Subscribe to pautas table changes
    const pautasChannel = supabase
      .channel('pautas-general-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pautas'
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('[useRealtimePautas] Pauta changed:', payload);
          onPautaChange();
        }
      )
      .subscribe((status) => {
        console.log('[useRealtimePautas] Pautas subscription status:', status);
      });

    return () => {
      console.log('[useRealtimePautas] Limpando subscription');
      supabase.removeChannel(pautasChannel);
    };
  }, [onPautaChange]);
};
