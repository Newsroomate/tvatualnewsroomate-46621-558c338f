
import { supabase } from "@/integrations/supabase/client";
import { SavedRundown, SavedRundownCreateInput } from "@/types/saved-rundowns";

export const saveRundownSnapshot = async (rundownData: SavedRundownCreateInput): Promise<SavedRundown> => {
  console.log("Salvando snapshot do espelho:", rundownData);
  
  const { data: currentUser } = await supabase.auth.getUser();
  
  if (!currentUser.user) {
    throw new Error("Usuário não autenticado");
  }

  // Fetch telejornal data to preserve in structure
  const { data: telejornalData } = await supabase
    .from("telejornais")
    .select("nome, horario")
    .eq("id", rundownData.telejornal_id)
    .maybeSingle();

  // Enhance structure with preserved telejornal info
  const enhancedEstrutura = {
    ...rundownData.estrutura,
    telejornal_original: {
      id: rundownData.telejornal_id,
      nome: telejornalData?.nome || "Telejornal",
      horario: telejornalData?.horario || ""
    }
  };
  
  const { data, error } = await supabase
    .from('espelhos_salvos')
    .insert({
      telejornal_id: rundownData.telejornal_id,
      data_referencia: rundownData.data_referencia,
      nome: rundownData.nome,
      estrutura: enhancedEstrutura,
      user_id: currentUser.user.id
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao salvar snapshot:", error);
    throw error;
  }

  return {
    ...data,
    estrutura: data.estrutura as SavedRundown['estrutura']
  } as SavedRundown;
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

  if (!data) {
    return null;
  }

  return {
    ...data,
    estrutura: data.estrutura as SavedRundown['estrutura']
  } as SavedRundown;
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

  return data?.map(item => ({
    ...item,
    estrutura: item.estrutura as SavedRundown['estrutura']
  } as SavedRundown)) || [];
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

  query = query.order('data_salvamento', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao buscar espelhos salvos:", error);
    throw error;
  }

  console.log("Found all saved rundowns:", data?.length || 0);

  // Get telejornal data for display purposes
  const telejornalIds = [...new Set(data?.map(r => r.telejornal_id).filter(Boolean))];
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

  // Convert the raw data to SavedRundown format with enhanced display info
  return data?.map(item => {
    const telejornalInfo = telejornaisData[item.telejornal_id];
    const estrutura = item.estrutura as any;
    const originalName = estrutura?.telejornal_original?.nome;
    const originalHorario = estrutura?.telejornal_original?.horario;
    
    // Determine if telejornal was deleted and get appropriate display name
    const isDeleted = !telejornalInfo && originalName;
    const displayName = telejornalInfo?.nome || originalName || "Telejornal Deletado";
    const finalDisplayName = isDeleted ? `${displayName} (Deletado)` : displayName;
    
    return {
      id: item.id,
      telejornal_id: item.telejornal_id,
      data_salvamento: item.data_salvamento,
      data_referencia: item.data_referencia,
      nome: item.nome,
      estrutura: {
        ...(item.estrutura as any),
        telejornal_info: {
          nome: finalDisplayName,
          horario: telejornalInfo?.horario || originalHorario || ""
        }
      } as SavedRundown['estrutura'],
      created_at: item.created_at,
      updated_at: item.updated_at,
      user_id: item.user_id
    };
  }) as SavedRundown[] || [];
};
