
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
      telejornais!inner(nome, horario)
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

  // Map the data to the ClosedRundown format
  return data.map(rundown => {
    const createdDate = new Date(rundown.created_at || "");
    return {
      id: rundown.id,
      telejornal_id: rundown.telejornal_id,
      data_referencia: rundown.data_referencia,
      nome: rundown.nome,
      jornal: rundown.telejornais?.nome || "",
      data: createdDate,
      dataFormatted: format(createdDate, "dd/MM/yyyy"),
      hora: rundown.telejornais?.horario || "",
      status: "Fechado",
      estrutura: rundown.estrutura as ClosedRundown['estrutura']
    };
  });
}
