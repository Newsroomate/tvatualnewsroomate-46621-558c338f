
import { supabase } from "@/integrations/supabase/client";
import { SavedRundown, SavedRundownCreateInput } from "@/types/saved-rundowns";

export const saveRundownSnapshot = async (rundownData: SavedRundownCreateInput): Promise<SavedRundown> => {
  console.log("Salvando snapshot do espelho:", rundownData);
  
  const { data, error } = await supabase
    .from('espelhos_salvos')
    .insert({
      telejornal_id: rundownData.telejornal_id,
      data_referencia: rundownData.data_referencia,
      nome: rundownData.nome,
      estrutura: rundownData.estrutura
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao salvar snapshot:", error);
    throw error;
  }

  return data as SavedRundown;
};

export const fetchLastSavedRundown = async (telejornalId: string): Promise<SavedRundown | null> => {
  console.log("Buscando último espelho salvo para telejornal:", telejornalId);
  
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

  return data as SavedRundown | null;
};

export const fetchSavedRundownsByDate = async (
  telejornalId: string, 
  targetDate: string
): Promise<SavedRundown[]> => {
  console.log("Buscando espelhos salvos por data:", { telejornalId, targetDate });
  
  const { data, error } = await supabase
    .from('espelhos_salvos')
    .select('*')
    .eq('telejornal_id', telejornalId)
    .eq('data_referencia', targetDate)
    .order('data_salvamento', { ascending: false });

  if (error) {
    console.error("Erro ao buscar espelhos por data:", error);
    throw error;
  }

  return data as SavedRundown[] || [];
};

export const fetchAllSavedRundowns = async (
  telejornalId?: string,
  targetDate?: string
): Promise<SavedRundown[]> => {
  console.log("Buscando todos os espelhos salvos:", { telejornalId, targetDate });
  
  let query = supabase
    .from('espelhos_salvos')
    .select(`
      *,
      telejornais!inner(
        id,
        nome
      )
    `);

  if (telejornalId && telejornalId !== "all") {
    query = query.eq('telejornal_id', telejornalId);
  }

  if (targetDate) {
    query = query.eq('data_referencia', targetDate);
  }

  query = query.order('data_salvamento', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao buscar espelhos salvos:", error);
    throw error;
  }

  // Convert the raw data to SavedRundown format, ensuring proper type conversion
  return data?.map((item: any) => ({
    id: item.id,
    telejornal_id: item.telejornal_id,
    data_salvamento: item.data_salvamento,
    data_referencia: item.data_referencia,
    nome: item.nome,
    estrutura: item.estrutura as SavedRundown['estrutura'], // Explicit type assertion
    created_at: item.created_at,
    updated_at: item.updated_at
  })) as SavedRundown[] || [];
};
