
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

  // Buscar espelhos salvos
  let query = supabase
    .from("espelhos_salvos")
    .select('*')
    .order("created_at", { ascending: false });

  // Filtro por data - usar a coluna 'data_referencia'
  if (selectedDate) {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    console.log("Filtering snapshots by date:", dateStr);
    query = query.eq('data_referencia', dateStr);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching closed rundown snapshots:", error);
    throw error;
  }

  console.log("Found snapshots:", data?.length || 0);

  // Transformar os dados para o formato esperado
  const snapshots: ClosedRundownSnapshot[] = (data || []).map((item: any) => {
    // Usar 'estrutura' em vez de 'espelho_data'
    const payload = item.estrutura || {};
    const telejornalData = payload.telejornal || {};
    
    // Extrair telejornal_id do item ou da estrutura
    const telejornalId = item.telejornal_id || payload.telejornal_id || telejornalData.id || '';
    
    console.log('Processing snapshot:', {
      id: item.id,
      telejornal_id: telejornalId,
      payload_keys: Object.keys(payload),
      telejornal_data: telejornalData
    });
    
    return {
      id: item.id,
      telejornal_id: telejornalId,
      data_fechamento: item.created_at,
      data_referencia: item.data_referencia || payload.data_referencia || '',
      nome_telejornal: telejornalData.nome || payload.nome_telejornal || "Telejornal",
      horario: telejornalData.horario || payload.horario || "",
      estrutura_completa: {
        telejornal: {
          id: telejornalId,
          nome: telejornalData.nome || payload.nome_telejornal || "Telejornal",
          horario: telejornalData.horario || payload.horario || ""
        },
        blocos: payload.blocos || [],
        metadata: {
          data_fechamento: item.created_at,
          total_blocos: (payload.blocos || []).length
        }
      },
      created_at: item.created_at,
      updated_at: item.updated_at
    };
  });

  // Aplicar filtros após carregar os dados
  let filteredSnapshots = snapshots;

  // Filtro por telejornal
  if (telejornalId && telejornalId !== "all") {
    filteredSnapshots = filteredSnapshots.filter(snapshot => 
      snapshot.telejornal_id === telejornalId
    );
  }

  // Aplicar filtros de horário se especificados
  if (selectedTime && !startTime && !endTime) {
    filteredSnapshots = filteredSnapshots.filter(snapshot => {
      const horario = snapshot.horario || snapshot.estrutura_completa.telejornal.horario;
      return horario === selectedTime;
    });
  }

  if (startTime && endTime) {
    filteredSnapshots = filteredSnapshots.filter(snapshot => {
      const horario = snapshot.horario || snapshot.estrutura_completa.telejornal.horario;
      if (!horario) return false;
      return horario >= startTime && horario <= endTime;
    });
  }

  console.log(`Filtered snapshots: ${filteredSnapshots.length} of ${snapshots.length} total`);
  return filteredSnapshots;
};
