
import { supabase } from "@/integrations/supabase/client";
import { Bloco, Materia, Telejornal } from "@/types";

export interface ClosedRundown {
  id: string;
  telejornal_id: string;
  nome_telejornal: string;
  data_fechamento: string;
  horario: string | null;
  status?: string;
}

export const fetchClosedRundowns = async (
  telejornalId?: string, 
  selectedDate?: Date | undefined,
  selectedTime?: string,
  startTime?: string,
  endTime?: string
): Promise<ClosedRundown[]> => {
  try {
    // This is a placeholder for the actual implementation
    // In a real implementation, this should get data from a table that stores closed rundowns
    console.log("Fetching closed rundowns with filters:", { telejornalId, selectedDate, selectedTime, startTime, endTime });
    
    // Mocking an empty array for now - this needs to be implemented properly
    return [];
  } catch (error) {
    console.error("Erro ao buscar espelhos fechados:", error);
    return [];
  }
};

// Function to fetch blocks and their materias for a specific rundown
export const fetchRundownContentForTeleprompter = async (
  rundownId: string
): Promise<(Bloco & { items: Materia[] })[]> => {
  try {
    // This would fetch blocks for a specific rundown
    const { data: blocks, error: blocksError } = await supabase
      .from('blocos')
      .select('*')
      .eq('telejornal_id', rundownId)
      .order('ordem', { ascending: true });
    
    if (blocksError) throw blocksError;
    
    if (!blocks || blocks.length === 0) {
      return [];
    }
    
    // For each block, fetch its materias
    const blocksWithItems = await Promise.all(
      blocks.map(async (block) => {
        const { data: materias, error: materiasError } = await supabase
          .from('materias')
          .select('*')
          .eq('bloco_id', block.id)
          .order('ordem', { ascending: true });
        
        if (materiasError) throw materiasError;
        
        // Add required fields for Materia interface compatibility
        const materiasWithRequiredFields = (materias || []).map(item => ({
          ...item,
          // Add missing required fields if they don't exist
          titulo: item.retranca || '', // Use retranca as titulo which is required by Materia interface
          descricao: item.texto || '',  // Use texto as descricao if needed
          tempo_estimado: item.duracao || 0, // Map duracao to tempo_estimado
          apresentador: item.reporter || '', // Map reporter to apresentador
          link_vt: item.clip || '' // Map clip to link_vt
        }));
        
        return {
          ...block,
          items: materiasWithRequiredFields
        } as Bloco & { items: Materia[] };
      })
    );
    
    return blocksWithItems;
  } catch (error) {
    console.error("Erro ao buscar conteúdo para o teleprompter:", error);
    return [];
  }
};
