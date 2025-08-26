
import { supabase } from "@/integrations/supabase/client";
import { Telejornal } from "@/types";
import { TablesInsert } from "@/integrations/supabase/types";

export const fetchTelejornais = async (): Promise<Telejornal[]> => {
  const { data, error } = await supabase
    .from('telejornais')
    .select('*')
    .order('nome', { ascending: true });

  if (error) {
    console.error("Erro ao buscar telejornais:", error);
    throw error;
  }

  return data || [];
};

export const createTelejornal = async (telejornal: TablesInsert<'telejornais'>): Promise<Telejornal> => {
  const { data, error } = await supabase
    .from('telejornais')
    .insert([telejornal])
    .select('*')
    .single();

  if (error) {
    console.error("Erro ao criar telejornal:", error);
    throw error;
  }

  return data as Telejornal;
};

export const updateTelejornal = async (id: string, updates: TablesInsert<'telejornais'>): Promise<Telejornal | null> => {
  console.log('updateTelejornal - Iniciando atualização:', { id, updates });
  
  const { data, error } = await supabase
    .from('telejornais')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error("Erro ao atualizar telejornal:", error);
    throw error;
  }

  console.log('updateTelejornal - Telejornal atualizado com sucesso:', data);
  return data as Telejornal;
};

export const deleteTelejornal = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('telejornais')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Erro ao deletar telejornal:", error);
    throw error;
  }
};

export const fetchTelejornal = async (id: string): Promise<Telejornal | null> => {
  const { data, error } = await supabase
    .from('telejornais')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Erro ao buscar telejornal ${id}:`, error);
    throw error;
  }

  return data as Telejornal;
};
