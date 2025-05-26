import { supabase } from "@/integrations/supabase/client";
import { Bloco, BlocoCreateInput, Materia } from "@/types";

export const fetchBlocosByTelejornal = async (telejornalId: string): Promise<Bloco[]> => {
  const { data, error } = await supabase
    .from('blocos')
    .select('*')
    .eq('telejornal_id', telejornalId)
    .order('ordem', { ascending: true });

  if (error) {
    console.error("Erro ao buscar blocos:", error);
    throw error;
  }

  return data || [];
};

export const createBloco = async (bloco: BlocoCreateInput): Promise<Bloco> => {
  const { data, error } = await supabase
    .from('blocos')
    .insert([bloco])
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar bloco:", error);
    throw error;
  }

  return data as Bloco;
};

export const updateBloco = async (id: string, updates: Partial<Bloco>): Promise<Bloco> => {
  const { data, error } = await supabase
    .from('blocos')
    .update(updates)
    .eq('id', id)
    .select()
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

export const deleteAllBlocos = async (telejornalId: string): Promise<void> => {
  console.log("Deletando todos os blocos do telejornal:", telejornalId);
  
  // First get all blocks for this telejornal
  const blocks = await fetchBlocosByTelejornal(telejornalId);
  
  // Delete all blocks (this will cascade delete all materias)
  for (const block of blocks) {
    await deleteBloco(block.id);
  }
  
  console.log("Todos os blocos foram deletados");
};
