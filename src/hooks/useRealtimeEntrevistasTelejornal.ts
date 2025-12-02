import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface UseRealtimeEntrevistasTelejornalProps {
  telejornalId: string;
  onEntrevistaChange: () => void;
}

export const useRealtimeEntrevistasTelejornal = ({
  telejornalId,
  onEntrevistaChange
}: UseRealtimeEntrevistasTelejornalProps) => {
  useEffect(() => {
    if (!telejornalId) return;

    console.log('[useRealtimeEntrevistasTelejornal] Iniciando subscription para telejornal:', telejornalId);

    // Subscribe to entrevistas table changes
    const entrevistasChannel = supabase
      .channel(`entrevistas-changes-${telejornalId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entrevistas'
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('[useRealtimeEntrevistasTelejornal] Entrevista changed:', payload);
          onEntrevistaChange();
        }
      )
      .subscribe((status) => {
        console.log('[useRealtimeEntrevistasTelejornal] Entrevistas subscription status:', status);
      });

    // Subscribe to entrevistas_telejornal table changes (link/unlink)
    const entrevistasTelejornalChannel = supabase
      .channel(`entrevistas-telejornal-changes-${telejornalId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entrevistas_telejornal',
          filter: `telejornal_id=eq.${telejornalId}`
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('[useRealtimeEntrevistasTelejornal] Entrevista-Telejornal link changed:', payload);
          onEntrevistaChange();
        }
      )
      .subscribe((status) => {
        console.log('[useRealtimeEntrevistasTelejornal] Entrevistas-Telejornal subscription status:', status);
      });

    return () => {
      console.log('[useRealtimeEntrevistasTelejornal] Limpando subscriptions');
      supabase.removeChannel(entrevistasChannel);
      supabase.removeChannel(entrevistasTelejornalChannel);
    };
  }, [telejornalId, onEntrevistaChange]);
};
