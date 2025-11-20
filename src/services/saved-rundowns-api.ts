
import { supabase } from "@/integrations/supabase/client";
import { SavedRundown, SavedRundownCreateInput } from "@/types/saved-rundowns";

export const saveRundownSnapshot = async (rundownData: SavedRundownCreateInput): Promise<SavedRundown> => {
  console.log("Salvando snapshot do espelho:", rundownData);
  
  const { data: currentUser } = await supabase.auth.getUser();
  
  if (!currentUser.user) {
    console.error("❌ ERRO CRÍTICO: Usuário não autenticado ao tentar salvar snapshot");
    throw new Error("Usuário não autenticado");
  }

  console.log("✅ Usuário autenticado:", currentUser.user.id);
  
  const { data, error } = await supabase
    .from('espelhos_salvos')
    .insert({
      nome: rundownData.nome,
      telejornal_id: rundownData.telejornal_id,
      data_referencia: rundownData.data_referencia,
      estrutura: rundownData.estrutura,
      user_id: currentUser.user.id  // ✅ CAMPO OBRIGATÓRIO PARA RLS
    })
    .select()
    .single();

  if (error) {
    console.error("❌ ERRO CRÍTICO ao salvar snapshot:", {
      error,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    throw error;
  }

  console.log("✅ Snapshot salvo com sucesso:", data.id);

  return {
    id: data.id,
    telejornal_id: data.telejornal_id,
    data_salvamento: data.data_salvamento,
    data_referencia: data.data_referencia,
    nome: data.nome,
    estrutura: data.estrutura,
    created_at: data.created_at,
    updated_at: data.updated_at,
    user_id: data.user_id
  } as SavedRundown;
};

export const fetchLastSavedRundown = async (telejornalId: string): Promise<SavedRundown | null> => {
  console.log("Buscando último espelho salvo para telejornal:", telejornalId);
  
  const { data, error } = await supabase
    .from('espelhos_salvos')
    .select('*')
    .eq('telejornal_id', telejornalId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar último espelho salvo:", error);
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    telejornal_id: data.telejornal_id,
    data_salvamento: data.data_salvamento,
    data_referencia: data.data_referencia,
    nome: data.nome,
    estrutura: data.estrutura,
    created_at: data.created_at,
    updated_at: data.updated_at
  } as SavedRundown;
};

export const fetchSavedRundownsByDate = async (
  telejornalId: string, 
  targetDate: string
): Promise<SavedRundown[]> => {
  console.log("Buscando espelhos salvos por data:", { telejornalId, targetDate });
  
  let query = supabase
    .from('espelhos_salvos')
    .select('*')
    .eq('data_referencia', targetDate)
    .order('created_at', { ascending: false });

  // Filter by telejornal if provided
  if (telejornalId && telejornalId !== "all") {
    query = query.eq('telejornal_id', telejornalId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao buscar espelhos por data:", error);
    throw error;
  }

  return (data || []).map((item: any) => {
    return {
      id: item.id,
      telejornal_id: item.telejornal_id,
      data_salvamento: item.data_salvamento,
      data_referencia: item.data_referencia,
      nome: item.nome,
      estrutura: item.estrutura,
      created_at: item.created_at,
      updated_at: item.updated_at
    } as SavedRundown;
  });
};

export const fetchAllSavedRundowns = async (
  telejornalId?: string,
  targetDate?: string
): Promise<SavedRundown[]> => {
  console.log("Buscando todos os espelhos salvos:", { telejornalId, targetDate });
  
  let query = supabase
    .from('espelhos_salvos')
    .select('*');

  if (telejornalId && telejornalId !== "all") {
    query = query.eq('telejornal_id', telejornalId);
  }

  if (targetDate) {
    console.log("Filtering all saved rundowns by date:", targetDate);
    query = query.eq('data_referencia', targetDate);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao buscar espelhos salvos:", error);
    throw error;
  }

  console.log("Found all saved rundowns:", data?.length || 0);

  // Convert the raw data to SavedRundown format, ensuring proper type conversion
  return (data || []).map((item: any) => {
    return {
      id: item.id,
      telejornal_id: item.telejornal_id,
      data_salvamento: item.data_salvamento,
      data_referencia: item.data_referencia,
      nome: item.nome,
      estrutura: item.estrutura,
      created_at: item.created_at,
      updated_at: item.updated_at
    } as SavedRundown;
  });
};
