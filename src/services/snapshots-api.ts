
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

  // Por enquanto, vamos buscar os espelhos salvos e transformá-los no formato esperado
  let query = supabase
    .from("espelhos_salvos")
    .select(`
      *,
      telejornais:telejornal_id (
        id,
        nome,
        horario
      )
    `)
    .order("created_at", { ascending: false });

  if (telejornalId && telejornalId !== "all") {
    query = query.eq("telejornal_id", telejornalId);
  }

  if (selectedDate) {
    const dateString = selectedDate.toISOString().split('T')[0];
    query = query.eq("data_referencia", dateString);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching closed rundown snapshots:", error);
    throw error;
  }

  // Transformar os dados para o formato esperado
  const snapshots: ClosedRundownSnapshot[] = (data || []).map((item: any) => {
    const telejornal = item.telejornais;
    
    return {
      id: item.id,
      telejornal_id: item.telejornal_id,
      data_fechamento: item.created_at,
      data_referencia: item.data_referencia,
      nome_telejornal: telejornal?.nome || "Telejornal",
      horario: telejornal?.horario || "",
      estrutura_completa: {
        telejornal: {
          id: telejornal?.id || item.telejornal_id,
          nome: telejornal?.nome || "Telejornal",
          horario: telejornal?.horario || ""
        },
        blocos: item.estrutura?.blocos || [],
        metadata: {
          data_fechamento: item.created_at,
          total_blocos: item.estrutura?.blocos?.length || 0
        }
      },
      created_at: item.created_at,
      updated_at: item.updated_at
    };
  });

  // Aplicar filtros de horário se especificados
  let filteredSnapshots = snapshots;

  if (selectedTime && !startTime && !endTime) {
    filteredSnapshots = snapshots.filter(snapshot => 
      snapshot.horario === selectedTime
    );
  }

  if (startTime && endTime) {
    filteredSnapshots = snapshots.filter(snapshot => {
      if (!snapshot.horario) return false;
      return snapshot.horario >= startTime && snapshot.horario <= endTime;
    });
  }

  return filteredSnapshots;
};
