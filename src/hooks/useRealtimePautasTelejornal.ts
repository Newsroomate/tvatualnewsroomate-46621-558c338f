import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface UseRealtimePautasTelejornalProps {
  telejornalId: string;
  onPautaChange: () => void;
}

export const useRealtimePautasTelejornal = ({
  telejornalId,
  onPautaChange
}: UseRealtimePautasTelejornalProps) => {
  useEffect(() => {
    if (!telejornalId) return;

    console.log('[useRealtimePautasTelejornal] Iniciando subscription para telejornal:', telejornalId);

    // Subscribe to pautas table changes
    const pautasChannel = supabase
      .channel(`pautas-changes-${telejornalId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pautas'
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('[useRealtimePautasTelejornal] Pauta changed:', payload);
          onPautaChange();
        }
      )
      .subscribe((status) => {
        console.log('[useRealtimePautasTelejornal] Pautas subscription status:', status);
      });

    // Subscribe to pautas_telejornal table changes (link/unlink)
    const pautasTelejornalChannel = supabase
      .channel(`pautas-telejornal-changes-${telejornalId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pautas_telejornal',
          filter: `telejornal_id=eq.${telejornalId}`
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('[useRealtimePautasTelejornal] Pauta-Telejornal link changed:', payload);
          onPautaChange();
        }
      )
      .subscribe((status) => {
        console.log('[useRealtimePautasTelejornal] Pautas-Telejornal subscription status:', status);
      });

    return () => {
      console.log('[useRealtimePautasTelejornal] Limpando subscriptions');
      supabase.removeChannel(pautasChannel);
      supabase.removeChannel(pautasTelejornalChannel);
    };
  }, [telejornalId, onPautaChange]);
};
