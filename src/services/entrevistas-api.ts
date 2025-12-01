import { supabase } from "@/integrations/supabase/client";
import { Entrevista, EntrevistaCreateInput } from "@/types/entrevistas";

export const fetchEntrevistasByTelejornal = async (telejornalId: string): Promise<Entrevista[]> => {
  const { data: links, error: linksError } = await supabase
    .from('entrevistas_telejornal')
    .select('entrevista_id')
    .eq('telejornal_id', telejornalId);

  if (linksError) throw linksError;
  if (!links || links.length === 0) return [];

  const entrevistaIds = links.map(l => l.entrevista_id);

  const { data, error } = await supabase
    .from('entrevistas')
    .select('*')
    .in('id', entrevistaIds)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createEntrevista = async (
  entrevista: EntrevistaCreateInput,
  telejornalId: string,
  userId: string
): Promise<Entrevista> => {
  const { data, error } = await supabase
    .from('entrevistas')
    .insert({
      ...entrevista,
      user_id: userId
    })
    .select()
    .single();

  if (error) throw error;

  // Link to telejornal
  const { error: linkError } = await supabase
    .from('entrevistas_telejornal')
    .insert({
      entrevista_id: data.id,
      telejornal_id: telejornalId
    });

  if (linkError) throw linkError;

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
