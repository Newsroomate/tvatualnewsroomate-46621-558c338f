
import { supabase } from "@/integrations/supabase/client";

export interface ClosedRundownSnapshot {
  id: string;
  telejornal_id: string;
  data_fechamento: string;
  data_referencia: string;
  nome_telejornal: string;
  horario: string;
  estrutura_completa: {
    telejornal: {
      id: string;
      nome: string;
      horario: string;
    };
    blocos: Array<{
      id: string;
      nome: string;
      ordem: number;
      materias: Array<{
        id: string;
        retranca: string;
        clip?: string;
        duracao: number;
        texto?: string;
        cabeca?: string;
        gc?: string;
        status?: string;
        pagina?: string;
        reporter?: string;
        ordem: number;
        tags?: string[];
        local_gravacao?: string;
        equipamento?: string;
        created_at: string;
        updated_at: string;
      }>;
      created_at: string;
      updated_at: string;
    }>;
    metadata: {
      data_fechamento: string;
      total_blocos: number;
    };
  };
  created_at: string;
  updated_at: string;
}

export const fetchClosedRundownSnapshots = async (
  telejornalId?: string,
  selectedDate?: Date,
  selectedTime?: string,
  startTime?: string,
  endTime?: string
): Promise<ClosedRundownSnapshot[]> => {
  console.log("Fetching closed rundown snapshots with filters:", {
    telejornalId,
    selectedDate,
    selectedTime,
    startTime,
    endTime
  });

  let query = supabase
    .from("espelhos_fechados_snapshots")
    .select("*")
    .order("data_fechamento", { ascending: false });

  if (telejornalId && telejornalId !== "all") {
    query = query.eq("telejornal_id", telejornalId);
  }

  if (selectedDate) {
    const dateString = selectedDate.toISOString().split('T')[0];
    query = query.eq("data_referencia", dateString);
  }

  if (selectedTime && !startTime && !endTime) {
    query = query.eq("horario", selectedTime);
  }

  if (startTime && endTime) {
    query = query.gte("horario", startTime).lte("horario", endTime);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching closed rundown snapshots:", error);
    throw error;
  }

  return data || [];
};
