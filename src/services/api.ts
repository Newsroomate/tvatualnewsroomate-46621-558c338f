import { supabase } from "@/integrations/supabase/client";
import { Telejornal, Bloco, Materia } from "@/types";
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

export const fetchBlocosByTelejornal = async (telejornalId: string): Promise<Bloco[]> => {
  const { data, error } = await supabase
    .from('blocos')
    .select('*')
    .eq('telejornal_id', telejornalId)
    .order('ordem', { ascending: true });

  if (error) {
    console.error(`Erro ao buscar blocos para o telejornal ${telejornalId}:`, error);
    return [];
  }

  return data || [];
};

export const createBloco = async (bloco: TablesInsert<'blocos'>): Promise<Bloco> => {
  const { data, error } = await supabase
    .from('blocos')
    .insert([bloco])
    .select('*')
    .single();

  if (error) {
    console.error("Erro ao criar bloco:", error);
    throw error;
  }

  return data as Bloco;
};

export const updateBloco = async (id: string, updates: TablesInsert<'blocos'>): Promise<Bloco | null> => {
  const { data, error } = await supabase
    .from('blocos')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error("Erro ao atualizar bloco:", error);
    throw error;
  }

  return data as Bloco;
};

export const deleteBloco = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('blocos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Erro ao deletar bloco:", error);
    throw error;
  }
};

export const fetchMateriasByBloco = async (blocoId: string): Promise<Materia[]> => {
  const { data, error } = await supabase
    .from('materias')
    .select('*')
    .eq('bloco_id', blocoId)
    .order('ordem', { ascending: true });

  if (error) {
    console.error(`Erro ao buscar matérias para o bloco ${blocoId}:`, error);
    return [];
  }

  return data || [];
};

export const createMateria = async (materia: TablesInsert<'materias'>): Promise<Materia> => {
  const { data, error } = await supabase
    .from('materias')
    .insert([materia])
    .select('*')
    .single();

  if (error) {
    console.error("Erro ao criar matéria:", error);
    throw error;
  }

  return data as Materia;
};

export const updateMateria = async (id: string, updates: TablesInsert<'materias'>): Promise<Materia | null> => {
  const { data, error } = await supabase
    .from('materias')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error("Erro ao atualizar matéria:", error);
    throw error;
  }

  return data as Materia;
};

export const deleteMateria = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('materias')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Erro ao deletar matéria:", error);
    throw error;
  }
};

// Export the espelho-api functions for easy access
export { fetchClosedRundowns } from "./espelhos-api";
