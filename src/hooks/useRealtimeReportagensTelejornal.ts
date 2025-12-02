import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface UseRealtimeReportagensTelejornalProps {
  telejornalId: string;
  onReportagemChange: () => void;
}

export const useRealtimeReportagensTelejornal = ({
  telejornalId,
  onReportagemChange
}: UseRealtimeReportagensTelejornalProps) => {
  useEffect(() => {
    if (!telejornalId) return;

    console.log('[useRealtimeReportagensTelejornal] Iniciando subscription para telejornal:', telejornalId);

    // Subscribe to reportagens table changes
    const reportagensChannel = supabase
      .channel(`reportagens-changes-${telejornalId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reportagens'
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('[useRealtimeReportagensTelejornal] Reportagem changed:', payload);
          onReportagemChange();
        }
      )
      .subscribe((status) => {
        console.log('[useRealtimeReportagensTelejornal] Reportagens subscription status:', status);
      });

    // Subscribe to reportagens_telejornal table changes (link/unlink)
    const reportagensTelejornalChannel = supabase
      .channel(`reportagens-telejornal-changes-${telejornalId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reportagens_telejornal',
          filter: `telejornal_id=eq.${telejornalId}`
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('[useRealtimeReportagensTelejornal] Reportagem-Telejornal link changed:', payload);
          onReportagemChange();
        }
      )
      .subscribe((status) => {
        console.log('[useRealtimeReportagensTelejornal] Reportagens-Telejornal subscription status:', status);
      });

    return () => {
      console.log('[useRealtimeReportagensTelejornal] Limpando subscriptions');
      supabase.removeChannel(reportagensChannel);
      supabase.removeChannel(reportagensTelejornalChannel);
    };
  }, [telejornalId, onReportagemChange]);
};
