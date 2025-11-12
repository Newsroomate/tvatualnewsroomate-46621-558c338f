
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Materia, Bloco } from "@/types";
import { processUpdatedMateria, calculateBlockTotalTime } from "@/components/news-schedule/utils";

type BlockWithItems = Bloco & { 
  items: Materia[];
  totalTime: number;
};

interface UseRealtimeMateriasProps {
  selectedJournal: string | null;
  newItemBlock: string | null;
  materiaToDelete: Materia | null;
}

/**
 * Custom hook to handle realtime subscriptions for materias
 * Note: This hook is disabled when selectedJournal is null (dual view mode)
 */
export const useRealtimeMaterias = ({
  selectedJournal,
  newItemBlock,
  materiaToDelete
}: UseRealtimeMateriasProps) => {
  const [blocks, setBlocks] = useState<BlockWithItems[]>([]);
  const pendingOptimisticUpdates = useRef<Set<string>>(new Set());
  
  // Setup realtime subscription for materias updates
  useEffect(() => {
    if (!selectedJournal) {
      console.log('Realtime materias disabled (dual view mode or no journal selected)');
      return;
    }
    
    console.log('Setting up enhanced realtime subscription for materias table');

    const handleMateriaUpdate = (updatedMateria: Materia, isInsert = false) => {
      console.log('Processing realtime materia update:', updatedMateria, { isInsert });
      
      // Verificar se esta é uma atualização que já fizemos localmente (otimística)
      if (pendingOptimisticUpdates.current.has(updatedMateria.id)) {
        console.log('Ignorando atualização realtime - já processada otimisticamente:', updatedMateria.id);
        return;
      }
      
      setBlocks(currentBlocks => {
        return currentBlocks.map(block => {
          // Para INSERTs, apenas adicionar se for para este bloco e não for uma criação local
          if (isInsert && block.id === updatedMateria.bloco_id) {
            const itemExists = block.items.some(item => item.id === updatedMateria.id);
            
            if (!itemExists && newItemBlock !== updatedMateria.bloco_id) {
              console.log('Adicionando nova matéria via realtime:', updatedMateria.id);
              
              const updatedItems = [...block.items, processUpdatedMateria(updatedMateria)]
                .sort((a, b) => (a.ordem || 0) - (b.ordem || 0)); // Ordenar por ordem
              
              const totalTime = calculateBlockTotalTime(updatedItems);
              
              return {
                ...block,
                items: updatedItems,
                totalTime
              };
            }
          }
          
          // Para UPDATEs, atualizar se a matéria existe neste bloco
          if (!isInsert && block.id === updatedMateria.bloco_id) {
            const itemIndex = block.items.findIndex(item => item.id === updatedMateria.id);
            
            if (itemIndex !== -1) {
              console.log('Atualizando matéria existente via realtime:', updatedMateria.id);
              
              const updatedItems = [...block.items];
              updatedItems[itemIndex] = processUpdatedMateria(updatedMateria);
              
              // Reordenar se necessário
              updatedItems.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
              
              const totalTime = calculateBlockTotalTime(updatedItems);
              
              return {
                ...block,
                items: updatedItems,
                totalTime
              };
            }
          }
          
          return block;
        });
      });
    };

    // Subscribe to all materias changes related to the current telejornal's blocks
    const channel = supabase
      .channel(`enhanced-materias-changes-${selectedJournal}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'materias',
      }, (payload) => {
        console.log('Realtime materia updated:', payload);
        const updatedMateria = payload.new as Materia;
        handleMateriaUpdate(updatedMateria, false);
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'materias'
      }, (payload) => {
        console.log('Realtime materia inserted:', payload);
        const newMateria = payload.new as Materia;
        handleMateriaUpdate(newMateria, true);
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'materias'
      }, (payload) => {
        console.log('Realtime materia deleted:', payload);
        const deletedMateria = payload.old as Materia;
        
        // Só processar se não foi uma exclusão local
        if (!materiaToDelete || materiaToDelete.id !== deletedMateria.id) {
          setBlocks(currentBlocks => 
            currentBlocks.map(block => {
              if (block.id === deletedMateria.bloco_id) {
                const updatedItems = block.items.filter(item => item.id !== deletedMateria.id);
                const totalTime = calculateBlockTotalTime(updatedItems);
                
                console.log('Removendo matéria via realtime:', deletedMateria.id);
                
                return {
                  ...block,
                  items: updatedItems,
                  totalTime
                };
              }
              return block;
            })
          );
        }
      })
      .subscribe((status) => {
        console.log('Enhanced realtime subscription status for materias:', status);
      });
    
    // Clean up subscription on unmount or when selectedJournal changes
    return () => {
      console.log('Cleaning up enhanced realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [selectedJournal, newItemBlock, materiaToDelete]);

  // Função para marcar uma atualização como otimística (para evitar duplicação realtime)
  const markOptimisticUpdate = (materiaId: string) => {
    pendingOptimisticUpdates.current.add(materiaId);
    
    // Limpar após 5 segundos para evitar memory leaks
    setTimeout(() => {
      pendingOptimisticUpdates.current.delete(materiaId);
    }, 5000);
  };

  return {
    blocks,
    setBlocks,
    markOptimisticUpdate
  };
};
