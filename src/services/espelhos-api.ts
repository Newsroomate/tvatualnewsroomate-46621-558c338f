
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface ClosedRundown {
  id: string;
  jornal: string;
  data: Date;
  dataFormatted: string;
  hora: string;
  status: string;
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
    .from("telejornais")
    .select("id, nome, created_at, horario, espelho_aberto")
    .eq("espelho_aberto", false);

  if (telejornalId && telejornalId !== "all") {
    query = query.eq("id", telejornalId);
  }

  if (selectedDate) {
    const dateString = format(selectedDate, "yyyy-MM-dd");
    query = query.gte("created_at", `${dateString}T00:00:00`)
      .lt("created_at", `${dateString}T23:59:59`);
  }

  // Filter by time if specified
  if (selectedTime && !startTime && !endTime) {
    // Extract hour and minute from the time string (HH:MM format)
    const [hour, minute] = selectedTime.split(":");
    if (hour && minute && selectedDate) {
      const dateString = format(selectedDate, "yyyy-MM-dd");
      const timePoint = `${dateString}T${hour}:${minute}:00`;
      
      // Find journals with the exact hour specified
      query = query.eq("horario", selectedTime);
    }
  }

  // Filter by time range if both start and end times are specified
  if (startTime && endTime && selectedDate) {
    query = query.gte("horario", startTime).lte("horario", endTime);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching closed rundowns:", error);
    throw error;
  }

  // Map the data to the ClosedRundown format
  return data.map(journal => {
    const createdDate = new Date(journal.created_at || "");
    return {
      id: journal.id,
      jornal: journal.nome,
      data: createdDate,
      dataFormatted: format(createdDate, "dd/MM/yyyy"),
      hora: journal.horario || "",
      status: "Fechado"
    };
  });
}
