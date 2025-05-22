
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
    // Build query to fetch closed rundowns (telejornais with espelho_aberto = false)
    let query = supabase
      .from('telejornais')
      .select('id, nome, horario, created_at, updated_at')
      .eq('espelho_aberto', false);
    
    // Apply telejornal filter if provided
    if (telejornalId && telejornalId !== 'all') {
      query = query.eq('id', telejornalId);
    }
    
    // Apply date filter if provided
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      query = query.gte('updated_at', `${dateStr}T00:00:00Z`)
                   .lt('updated_at', `${dateStr}T23:59:59Z`);
    }
    
    // Apply time filter if provided (exact time match)
    if (selectedTime && !showTimeRange) {
      // Convert time to 24-hour format with leading zeros
      const timeRegex = `T${selectedTime.padStart(5, '0')}:00`; 
      query = query.ilike('horario', `%${timeRegex}%`);
    }
    
    // Apply time range filter if provided
    if (startTime && endTime && startTime && endTime) {
      // This is a simplification - in a real implementation we would need to handle time ranges properly
      // For now, we'll filter based on the horario field string comparison
      query = query.gte('horario', startTime).lte('horario', endTime);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching closed rundowns:', error);
      return [];
    }
    
    // Map the data to the expected format
    return data.map(rundown => ({
      id: rundown.id,
      telejornal_id: rundown.id,
      nome_telejornal: rundown.nome,
      data_fechamento: rundown.updated_at,
      horario: rundown.horario,
      status: 'closed'
    }));
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
