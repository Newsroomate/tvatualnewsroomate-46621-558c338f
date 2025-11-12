import { supabase } from "@/integrations/supabase/client";

export interface Entrevista {
  id: string;
  telejornal_id: string;
  titulo: string;
  entrevistado: string;
  descricao?: string;
  local?: string;
  horario?: string;
  data_entrevista?: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export const fetchEntrevistasByTelejornal = async (telejornalId: string): Promise<Entrevista[]> => {
  const { data, error } = await supabase
    .from('entrevistas')
    .select('*')
    .eq('telejornal_id', telejornalId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Erro ao buscar entrevistas:", error);
    throw error;
  }

  return data || [];
};

export const createEntrevista = async (entrevista: Omit<Entrevista, 'id' | 'created_at' | 'updated_at'>): Promise<Entrevista> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('entrevistas')
    .insert([{ ...entrevista, user_id: user?.id }])
    .select('*')
    .single();

  if (error) {
    console.error("Erro ao criar entrevista:", error);
    throw error;
  }

  return data as Entrevista;
};

export const updateEntrevista = async (id: string, updates: Partial<Entrevista>): Promise<Entrevista> => {
  const { data, error } = await supabase
    .from('entrevistas')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error("Erro ao atualizar entrevista:", error);
    throw error;
  }

  return data as Entrevista;
};

export const deleteEntrevista = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('entrevistas')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Erro ao deletar entrevista:", error);
    throw error;
  }
};
