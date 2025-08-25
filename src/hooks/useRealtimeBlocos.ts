import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bloco } from "@/types";

interface UseRealtimeBlocosProps {
  telejornalId?: string | null;
  onBlocoUpdate?: (bloco: Bloco) => void;
  onBlocoInsert?: (bloco: Bloco) => void;
  onBlocoDelete?: (blocoId: string) => void;
}

export const useRealtimeBlocos = ({ 
  telejornalId, 
  onBlocoUpdate, 
  onBlocoInsert, 
  onBlocoDelete 
}: UseRealtimeBlocosProps = {}) => {
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    if (!telejornalId) {
      console.log('Realtime blocos disabled - no telejornal selected');
      return;
    }

    console.log('Setting up realtime subscription for blocos, telejornal:', telejornalId);
    
    const channel = supabase
      .channel(`blocos-changes-${telejornalId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'blocos',
      }, (payload) => {
        const updatedBloco = payload.new as Bloco;
        console.log('Bloco updated via realtime:', updatedBloco);
        
        // Só processar se for do telejornal atual
        if (updatedBloco.telejornal_id === telejornalId) {
          onBlocoUpdate?.(updatedBloco);
          setLastUpdate(updatedBloco.id);
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'blocos'
      }, (payload) => {
        const newBloco = payload.new as Bloco;
        console.log('Bloco inserted via realtime:', newBloco);
        
        if (newBloco.telejornal_id === telejornalId) {
          onBlocoInsert?.(newBloco);
          setLastUpdate(newBloco.id);
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'blocos'
      }, (payload) => {
        const deletedBloco = payload.old as Bloco;
        console.log('Bloco deleted via realtime:', deletedBloco);
        
        if (deletedBloco.telejornal_id === telejornalId) {
          onBlocoDelete?.(deletedBloco.id);
          setLastUpdate(deletedBloco.id);
        }
      })
      .subscribe((status) => {
        console.log('Blocos realtime subscription status:', status);
      });
    
    return () => {
      console.log('Cleaning up blocos realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [telejornalId, onBlocoUpdate, onBlocoInsert, onBlocoDelete]);

  return { lastUpdate };
};