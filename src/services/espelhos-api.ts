
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
      telejornal_id,
      data_referencia,
      nome,
      estrutura,
      created_at,
      user_id
    `);

  if (telejornalId && telejornalId !== "all") {
    query = query.eq("telejornal_id", telejornalId);
  }

  if (selectedDate) {
    // Garantir que a data seja formatada corretamente para UTC sem conversão de timezone
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    console.log("Filtering by date:", dateString, "from selected date:", selectedDate);
    query = query.eq("data_referencia", dateString);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching closed rundowns:", error);
    throw error;
  }

  console.log("Found rundowns:", data?.length || 0);

  // Get unique telejornal IDs to fetch telejornal data
  const telejornalIds = [...new Set(data?.map(r => r.telejornal_id).filter(Boolean))];
  
  // Fetch telejornal data separately
  const telejornaisData: Record<string, { nome: string; horario: string }> = {};
  
  if (telejornalIds.length > 0) {
    const { data: telejornais } = await supabase
      .from("telejornais")
      .select("id, nome, horario")
      .in("id", telejornalIds);
    
    telejornais?.forEach(tj => {
      telejornaisData[tj.id] = { nome: tj.nome, horario: tj.horario };
    });
  }

  // Map the data to the ClosedRundown format
  return data.map(rundown => {
    const createdDate = new Date(rundown.created_at || "");
    const telejornalInfo = telejornaisData[rundown.telejornal_id];
    
    return {
      id: rundown.id,
      telejornal_id: rundown.telejornal_id,
      data_referencia: rundown.data_referencia,
      nome: rundown.nome,
      jornal: telejornalInfo?.nome || "Telejornal Deletado",
      data: createdDate,
      dataFormatted: format(createdDate, "dd/MM/yyyy"),
      hora: telejornalInfo?.horario || "",
      status: "Fechado",
      user_id: rundown.user_id,
      estrutura: rundown.estrutura as ClosedRundown['estrutura']
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

  const { data, error } = await supabase
    .from("espelhos_salvos")
    .insert({
      telejornal_id: telejornalId,
      nome,
      data_referencia: dataReferencia,
      estrutura,
      user_id: currentUser.user.id
    })
    .select(`
      id,
      telejornal_id,
      data_referencia,
      nome,
      estrutura,
      created_at,
      user_id
    `)
    .single();

  if (error) {
    console.error("Error saving rundown:", error);
    throw error;
  }

  // Fetch telejornal data separately
  const { data: telejornalData } = await supabase
    .from("telejornais")
    .select("nome, horario")
    .eq("id", telejornalId)
    .maybeSingle();

  const createdDate = new Date(data.created_at);
  return {
    id: data.id,
    telejornal_id: data.telejornal_id,
    data_referencia: data.data_referencia,
    nome: data.nome,
    jornal: telejornalData?.nome || "Telejornal Deletado",
    data: createdDate,
    dataFormatted: format(createdDate, "dd/MM/yyyy"),
    hora: telejornalData?.horario || "",
    status: "Fechado",
    user_id: data.user_id,
    estrutura: data.estrutura as ClosedRundown['estrutura']
  };
}
