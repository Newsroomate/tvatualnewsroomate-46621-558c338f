import { supabase } from "@/integrations/supabase/client";
import { Entrevista, EntrevistaCreateInput } from "@/types/entrevistas";

export const fetchEntrevistasByTelejornal = async (telejornalId: string): Promise<Entrevista[]> => {
  console.log('[entrevistas-api] Buscando entrevistas para telejornal:', telejornalId);
  
  const { data: links, error: linksError } = await supabase
    .from('entrevistas_telejornal')
    .select('entrevista_id')
    .eq('telejornal_id', telejornalId);

  if (linksError) {
    console.error('[entrevistas-api] Erro ao buscar links:', linksError);
    throw linksError;
  }
  
  console.log('[entrevistas-api] Links encontrados:', links);
  
  if (!links || links.length === 0) {
    console.log('[entrevistas-api] Nenhum link encontrado');
    return [];
  }

  const entrevistaIds = links.map(l => l.entrevista_id);
  console.log('[entrevistas-api] IDs de entrevistas:', entrevistaIds);

  const { data, error } = await supabase
    .from('entrevistas')
    .select('*')
    .in('id', entrevistaIds)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[entrevistas-api] Erro ao buscar entrevistas:', error);
    throw error;
  }
  
  console.log('[entrevistas-api] Entrevistas encontradas:', data);
  return data || [];
};

export const createEntrevista = async (
  entrevista: EntrevistaCreateInput,
  telejornalId: string,
  userId: string
): Promise<Entrevista> => {
  console.log('[entrevistas-api] Criando entrevista:', { entrevista, telejornalId, userId });
  
  const { data, error } = await supabase
    .from('entrevistas')
    .insert({
      ...entrevista,
      user_id: userId
    })
    .select()
    .single();

  if (error) {
    console.error('[entrevistas-api] Erro ao criar entrevista:', error);
    throw error;
  }

  console.log('[entrevistas-api] Entrevista criada:', data);

  // Link to telejornal
  const { error: linkError } = await supabase
    .from('entrevistas_telejornal')
    .insert({
      entrevista_id: data.id,
      telejornal_id: telejornalId
    });

  if (linkError) {
    console.error('[entrevistas-api] Erro ao vincular entrevista:', linkError);
    throw linkError;
  }

  console.log('[entrevistas-api] Entrevista vinculada ao telejornal');
  return data;
};

export const updateEntrevista = async (
  id: string,
  updates: Partial<EntrevistaCreateInput>
): Promise<Entrevista> => {
  const { data, error } = await supabase
    .from('entrevistas')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteEntrevista = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('entrevistas')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};
