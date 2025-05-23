
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

export interface ClosedRundown {
  id: string;
  jornal: string;
  data: string;
  dataFormatted: string;
  hora: string;
  status: string;
}

// Busca espelhos fechados baseado nos filtros
export const fetchClosedRundowns = async (
  selectedJornal?: string,
  selectedDate?: Date,
  selectedTime?: string,
  startTime?: string,
  endTime?: string
): Promise<ClosedRundown[]> => {
  try {
    // Iniciar uma query base para telejornais
    let query = supabase
      .from('telejornais')
      .select(`
        id,
        nome,
        horario,
        created_at,
        updated_at
      `)
      .eq('espelho_aberto', false); // Apenas telejornais com espelho fechado
    
    // Filtrar por jornal específico se fornecido
    if (selectedJornal && selectedJornal !== 'all') {
      query = query.eq('id', selectedJornal);
    }

    const { data: telejornais, error } = await query;

    if (error) {
      console.error('Erro ao buscar telejornais com espelhos fechados:', error);
      throw error;
    }

    if (!telejornais || telejornais.length === 0) {
      return [];
    }

    // Mapear os telejornais para o formato de ClosedRundown
    const closedRundowns: ClosedRundown[] = telejornais.map(tj => {
      const createdDate = new Date(tj.created_at);
      const formattedDate = format(createdDate, 'yyyy-MM-dd');
      const formattedDisplayDate = format(createdDate, 'dd/MM/yyyy');
      
      // Extrair hora do campo horário ou usar a hora da criação
      const horario = tj.horario || format(createdDate, 'HH:mm');

      return {
        id: tj.id,
        jornal: tj.nome,
        data: formattedDate,
        dataFormatted: formattedDisplayDate,
        hora: horario,
        status: 'Fechado'
      };
    });

    // Aplicar filtros adicionais no cliente
    let filteredRundowns = [...closedRundowns];
    
    // Filtrar por data
    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      filteredRundowns = filteredRundowns.filter(rundown => 
        rundown.data === dateStr
      );
    }
    
    // Filtrar por horário específico
    if (selectedTime) {
      filteredRundowns = filteredRundowns.filter(rundown => 
        rundown.hora === selectedTime
      );
    }
    
    // Filtrar por faixa de horário
    if (startTime && endTime) {
      filteredRundowns = filteredRundowns.filter(rundown => 
        rundown.hora >= startTime && rundown.hora <= endTime
      );
    }

    return filteredRundowns;
    
  } catch (error) {
    console.error('Erro ao buscar espelhos fechados:', error);
    toast({
      title: "Erro ao buscar espelhos fechados",
      description: "Não foi possível carregar os espelhos fechados",
      variant: "destructive",
    });
    return [];
  }
};
