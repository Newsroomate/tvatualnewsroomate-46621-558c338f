
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bloco } from "@/types";
import { toastService } from "@/utils/toast-utils";

interface UseRealTimeBlocosProps {
  selectedJournal: string | null;
}

/**
 * Custom hook to handle realtime subscriptions for blocos
 */
export const useRealtimeBlocos = ({
  selectedJournal
}: UseRealTimeBlocosProps) => {
  const [blocks, setBlocks] = useState<Bloco[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch initial blocks data
  useEffect(() => {
    const fetchBlocks = async () => {
      if (!selectedJournal) {
        setBlocks([]);
        return;
      }

      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('blocos')
          .select('*')
          .eq('telejornal_id', selectedJournal)
          .order('ordem');

        if (error) {
          console.error('Error fetching blocks:', error);
          toastService.error("Erro ao carregar blocos", error.message);
          return;
        }

        setBlocks(data as Bloco[]);
      } catch (error) {
        console.error('Exception fetching blocks:', error);
        toastService.error("Erro ao carregar blocos", "Ocorreu um erro ao buscar os blocos");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlocks();
  }, [selectedJournal]);

  // Setup realtime subscription for blocos updates
  useEffect(() => {
    if (!selectedJournal) return;
    
    console.log('Setting up realtime subscription for blocos table');
    
    const handleBlocoUpdate = (updatedBloco: Bloco) => {
      console.log('Processing bloco update:', updatedBloco);
      
      setBlocks(currentBlocks => {
        // Check if the bloco already exists
        const blockExists = currentBlocks.some(block => block.id === updatedBloco.id);
        
        if (blockExists) {
          // Update existing bloco
          return currentBlocks.map(block => 
            block.id === updatedBloco.id ? updatedBloco : block
          );
        } else {
          // Add new bloco and ensure proper sorting by ordem
          const newBlocks = [...currentBlocks, updatedBloco];
          return newBlocks.sort((a, b) => a.ordem - b.ordem);
        }
      });
    };
    
    // Subscribe to all blocos changes related to the current telejornal
    const channel = supabase
      .channel('public:blocos-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'blocos',
        filter: `telejornal_id=eq.${selectedJournal}`
      }, (payload) => {
        console.log('Bloco updated via realtime:', payload);
        const updatedBloco = payload.new as Bloco;
        handleBlocoUpdate(updatedBloco);
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'blocos',
        filter: `telejornal_id=eq.${selectedJournal}`
      }, (payload) => {
        console.log('Bloco inserted:', payload);
        const newBloco = payload.new as Bloco;
        handleBlocoUpdate(newBloco);
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'blocos',
        filter: `telejornal_id=eq.${selectedJournal}`
      }, (payload) => {
        console.log('Bloco deleted:', payload);
        const deletedBloco = payload.old as Bloco;
        
        setBlocks(currentBlocks => 
          currentBlocks.filter(block => block.id !== deletedBloco.id)
        );
      })
      .subscribe((status) => {
        console.log('Realtime subscription status for blocos:', status);
      });
    
    // Clean up subscription on unmount or when selectedJournal changes
    return () => {
      console.log('Cleaning up realtime subscription for blocos');
      supabase.removeChannel(channel);
    };
  }, [selectedJournal]);

  return {
    blocks,
    setBlocks,
    isLoading
  };
};
