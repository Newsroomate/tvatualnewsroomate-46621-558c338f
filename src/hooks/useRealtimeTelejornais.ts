import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Telejornal } from "@/types";

interface UseRealtimeTelejornaisProps {
  onTelejornalUpdate?: (telejornal: Telejornal) => void;
}

export const useRealtimeTelejornais = ({ onTelejornalUpdate }: UseRealtimeTelejornaisProps = {}) => {
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const callbackRef = useRef(onTelejornalUpdate);
  const channelRef = useRef<any>(null);

  // Update ref when callback changes
  useEffect(() => {
    callbackRef.current = onTelejornalUpdate;
  }, [onTelejornalUpdate]);

  // Stable callback using ref
  const stableCallback = useCallback((telejornal: Telejornal) => {
    if (callbackRef.current) {
      callbackRef.current(telejornal);
    }
  }, []);

  useEffect(() => {
    // Only create subscription once
    if (channelRef.current) return;
    
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
        
        // Use stable callback
        stableCallback(updatedTelejornal);
        setLastUpdate(updatedTelejornal.id);
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'telejornais'
      }, (payload) => {
        const newTelejornal = payload.new as Telejornal;
        console.log('Telejornal inserted via realtime:', newTelejornal);
        
        stableCallback(newTelejornal);
        setLastUpdate(newTelejornal.id);
      })
      .subscribe((status) => {
        console.log('Telejornais realtime subscription status:', status);
      });
    
    channelRef.current = channel;
    
    return () => {
      console.log('Cleaning up telejornais realtime subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [stableCallback]);

  return { lastUpdate };
};