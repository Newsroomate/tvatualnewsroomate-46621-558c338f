
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface ClosedRundown {
  id: string;
  telejornal_id: string;
  data_referencia: string;
  nome: string;
  jornal: string;
  data: Date;
  dataFormatted: string;
  hora: string;
  status: string;
  user_id?: string;
  estrutura?: {
    blocos: Array<{
      id: string;
      nome: string;
      ordem: number;
      items: Array<{
        id: string;
        retranca: string;
        clip?: string;
        duracao: number;
        pagina?: string;
        reporter?: string;
        status?: string;
        texto?: string;
        cabeca?: string;
        ordem: number;
      }>;
    }>;
  };
}

export async function fetchClosedRundowns(
  telejornalId?: string,
  selectedDate?: Date,
  selectedTime?: string,
  startTime?: string,
  endTime?: string
): Promise<ClosedRundown[]> {
  console.info("Fetching closed rundowns with filters:", {
    telejornalId,
    selectedDate: selectedDate ? format(selectedDate, "yyyy-MM-dd") : null,
    selectedTime,
    startTime,
    endTime
  });

  let query = supabase
    .from("espelhos_salvos")
    .select(`
      id,
      nome,
      estrutura,
      data_referencia,
      created_at,
      telejornal_id
    `);

  if (telejornalId && telejornalId !== "all") {
    query = query.eq('telejornal_id', telejornalId);
  }

  if (selectedDate) {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    console.log("Filtering by date:", dateStr);
    query = query.eq('data_referencia', dateStr);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching closed rundowns:", error);
    throw error;
  }

  console.log("Found rundowns:", data?.length || 0);

  return data.map(rundown => {
    const createdDate = new Date(rundown.created_at);
    const payload = (rundown as any).estrutura || {};
    const tj = (payload as any).telejornal || {};
    
    console.log('Processing rundown:', {
      id: rundown.id,
      telejornal_id: rundown.telejornal_id,
      payload_keys: Object.keys(payload),
      telejornal_data: tj
    });
    
    return {
      id: rundown.id,
      telejornal_id: rundown.telejornal_id || "",
      data_referencia: rundown.data_referencia || "",
      nome: rundown.nome,
      jornal: tj.nome || payload.nome_telejornal || "",
      data: createdDate,
      dataFormatted: format(createdDate, "dd/MM/yyyy"),
      hora: tj.horario || payload.horario || "",
      status: "Fechado",
      estrutura: payload as ClosedRundown['estrutura']
    };
  });
}

export async function saveRundown(
  telejornalId: string,
  nome: string,
  dataReferencia: string,
  estrutura: any
): Promise<ClosedRundown> {
  const { data: currentUser } = await supabase.auth.getUser();
  
  if (!currentUser.user) {
    throw new Error("Usuário não autenticado");
  }

  // Buscar informações do telejornal para incluir na estrutura
  const { data: telejornalData } = await supabase
    .from("telejornais")
    .select("id, nome, horario")
    .eq("id", telejornalId)
    .single();

  // Garantir que as informações do telejornal estejam incluídas na estrutura
  const estruturaComTelejornal = {
    ...estrutura,
    telejornal: telejornalData || { id: telejornalId, nome: "Telejornal", horario: "" },
    telejornal_id: telejornalId,
    data_referencia: dataReferencia,
    nome_telejornal: telejornalData?.nome || "Telejornal",
    horario: telejornalData?.horario || ""
  };

  const { data, error } = await supabase
    .from("espelhos_salvos")
    .insert({
      nome,
      telejornal_id: telejornalId,
      estrutura: estruturaComTelejornal,
      data_referencia: dataReferencia
    })
    .select(`
      id,
      nome,
      estrutura,
      data_referencia,
      created_at,
      telejornal_id
    `)
    .single();

  if (error) {
    console.error("Error saving rundown:", error);
    throw error;
  }

  const createdDate = new Date(data.created_at);
  const payload = (data as any).estrutura || {};
  const tj = (payload as any).telejornal || {};
  return {
    id: data.id,
    telejornal_id: data.telejornal_id || "",
    data_referencia: data.data_referencia || "",
    nome: data.nome,
    jornal: tj?.nome || payload.nome_telejornal || "",
    data: createdDate,
    dataFormatted: format(createdDate, "dd/MM/yyyy"),
    hora: tj?.horario || payload.horario || "",
    status: "Fechado",
    estrutura: payload as ClosedRundown['estrutura']
  };
}
