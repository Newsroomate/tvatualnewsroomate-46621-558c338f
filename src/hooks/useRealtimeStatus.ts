import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook para monitorar o status da conexão realtime
 * Útil para debug e para mostrar indicadores visuais de conectividade
 */
export const useRealtimeStatus = () => {
  const [status, setStatus] = useState<string>('DISCONNECTED');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    console.log('Monitorando status da conexão realtime...');

    const channel = supabase
      .channel('status-monitor')
      .subscribe((status) => {
        console.log('Status da conexão realtime:', status);
        setStatus(status);
        setLastUpdate(new Date());
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    status,
    lastUpdate,
    isConnected: status === 'SUBSCRIBED'
  };
};