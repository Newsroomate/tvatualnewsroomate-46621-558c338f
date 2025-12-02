import { supabase } from "@/integrations/supabase/client";
import { Reportagem, ReportagemCreateInput } from "@/types/reportagens";

export const fetchReportagensByTelejornal = async (telejornalId: string): Promise<Reportagem[]> => {
  console.log('[reportagens-api] Buscando reportagens para telejornal:', telejornalId);
  
  const { data: links, error: linksError } = await supabase
    .from('reportagens_telejornal')
    .select('reportagem_id')
    .eq('telejornal_id', telejornalId);

  if (linksError) {
    console.error('[reportagens-api] Erro ao buscar links:', linksError);
    throw linksError;
  }
  
  console.log('[reportagens-api] Links encontrados:', links);
  
  if (!links || links.length === 0) {
    console.log('[reportagens-api] Nenhum link encontrado');
    return [];
  }

  const reportagemIds = links.map(l => l.reportagem_id);
  console.log('[reportagens-api] IDs de reportagens:', reportagemIds);

  const { data, error } = await supabase
    .from('reportagens')
    .select('*')
    .in('id', reportagemIds)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[reportagens-api] Erro ao buscar reportagens:', error);
    throw error;
  }
  
  console.log('[reportagens-api] Reportagens encontradas:', data);
  return data || [];
};

export const createReportagem = async (
  reportagem: ReportagemCreateInput,
  telejornalId: string,
  userId: string
): Promise<Reportagem> => {
  console.log('[reportagens-api] Criando reportagem:', { reportagem, telejornalId, userId });
  
  const { data, error } = await supabase
    .from('reportagens')
    .insert({
      ...reportagem,
      user_id: userId
    })
    .select()
    .single();

  if (error) {
    console.error('[reportagens-api] Erro ao criar reportagem:', error);
    throw error;
  }

  console.log('[reportagens-api] Reportagem criada:', data);

  // Link to telejornal
  const { error: linkError } = await supabase
    .from('reportagens_telejornal')
    .insert({
      reportagem_id: data.id,
      telejornal_id: telejornalId
    });

  if (linkError) {
    console.error('[reportagens-api] Erro ao vincular reportagem:', linkError);
    throw linkError;
  }

  console.log('[reportagens-api] Reportagem vinculada ao telejornal');
  return data;
};

export const updateReportagem = async (
  id: string,
  updates: Partial<ReportagemCreateInput>
): Promise<Reportagem> => {
  const { data, error } = await supabase
    .from('reportagens')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteReportagem = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('reportagens')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};
