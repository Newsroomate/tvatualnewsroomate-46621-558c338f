import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Telejornal } from "@/types";

interface UseRealtimeTelejornaisProps {
  onTelejornalUpdate?: (telejornal: Telejornal) => void;
}

export const useRealtimeTelejornais = ({ onTelejornalUpdate }: UseRealtimeTelejornaisProps = {}) => {
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    console.log('Setting up realtime subscription for telejornais');
    
    const channel = supabase
      .channel('layout-telejornais-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'telejornais',
      }, (payload) => {
        const updatedTelejornal = payload.new as Telejornal;
        console.log('useRealtimeTelejornais - Telejornal updated via realtime:', updatedTelejornal);
        console.log('useRealtimeTelejornais - Campo espelho_aberto:', updatedTelejornal.espelho_aberto);
        
        // Notificar sobre a atualização
        onTelejornalUpdate?.(updatedTelejornal);
        setLastUpdate(updatedTelejornal.id);
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'telejornais'
      }, (payload) => {
        const newTelejornal = payload.new as Telejornal;
        console.log('Telejornal inserted via realtime:', newTelejornal);
        
        onTelejornalUpdate?.(newTelejornal);
        setLastUpdate(newTelejornal.id);
      })
      .subscribe((status) => {
        console.log('Telejornais realtime subscription status:', status);
      });
    
    return () => {
      console.log('Cleaning up telejornais realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [onTelejornalUpdate]);

  return { lastUpdate };
};