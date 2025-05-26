
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Bloco, Materia } from "@/types";

export interface SavedRundown {
  id: string;
  telejornal_id: string;
  data_salvamento: Date;
  data_referencia: Date;
  nome: string;
  estrutura: {
    blocks: (Bloco & { items: Materia[], totalTime: number })[];
  };
  created_at: string;
  updated_at: string;
}

export interface SavedRundownDisplay {
  id: string;
  jornal: string;
  data: Date;
  dataFormatted: string;
  hora: string;
  status: string;
}

export async function saveRundownSnapshot(
  telejornalId: string,
  telejornalNome: string,
  blocks: (Bloco & { items: Materia[], totalTime: number })[]
): Promise<SavedRundown> {
  const estrutura = { blocks };
  const dataReferencia = new Date();
  
  const { data, error } = await supabase
    .from('espelhos_salvos')
    .insert([{
      telejornal_id: telejornalId,
      nome: telejornalNome,
      data_referencia: format(dataReferencia, 'yyyy-MM-dd'),
      estrutura
    }])
    .select('*')
    .single();

  if (error) {
    console.error("Erro ao salvar snapshot do espelho:", error);
    throw error;
  }

  return {
    ...data,
    data_salvamento: new Date(data.data_salvamento),
    data_referencia: new Date(data.data_referencia)
  } as SavedRundown;
}

export async function fetchLastSavedRundown(telejornalId: string): Promise<SavedRundown | null> {
  const { data, error } = await supabase
    .from('espelhos_salvos')
    .select('*')
    .eq('telejornal_id', telejornalId)
    .order('data_salvamento', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar último espelho salvo:", error);
    throw error;
  }

  if (!data) return null;

  return {
    ...data,
    data_salvamento: new Date(data.data_salvamento),
    data_referencia: new Date(data.data_referencia)
  } as SavedRundown;
}

export async function fetchSavedRundownsByDate(
  telejornalId?: string,
  selectedDate?: Date
): Promise<SavedRundownDisplay[]> {
  let query = supabase
    .from('espelhos_salvos')
    .select(`
      id,
      telejornal_id,
      nome,
      data_salvamento,
      data_referencia,
      telejornais!inner(nome)
    `)
    .order('data_salvamento', { ascending: false });

  if (telejornalId && telejornalId !== "all") {
    query = query.eq('telejornal_id', telejornalId);
  }

  if (selectedDate) {
    const dateString = format(selectedDate, "yyyy-MM-dd");
    query = query.eq('data_referencia', dateString);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao buscar espelhos salvos:", error);
    throw error;
  }

  return data.map(item => ({
    id: item.id,
    jornal: (item.telejornais as any).nome,
    data: new Date(item.data_salvamento),
    dataFormatted: format(new Date(item.data_salvamento), "dd/MM/yyyy"),
    hora: format(new Date(item.data_salvamento), "HH:mm"),
    status: "Salvo"
  }));
}

export async function fetchSavedRundown(id: string): Promise<SavedRundown | null> {
  const { data, error } = await supabase
    .from('espelhos_salvos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error("Erro ao buscar espelho salvo:", error);
    throw error;
  }

  return {
    ...data,
    data_salvamento: new Date(data.data_salvamento),
    data_referencia: new Date(data.data_referencia)
  } as SavedRundown;
}
