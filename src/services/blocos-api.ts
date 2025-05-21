
import { supabase } from "@/integrations/supabase/client";
import { Bloco, BlocoCreateInput } from "@/types";
import { toastService } from "@/utils/toast-utils";

export const fetchBlocosByTelejornal = async (telejornalId: string) => {
  const { data, error } = await supabase
    .from('blocos')
    .select('*')
    .eq('telejornal_id', telejornalId)
    .order('ordem');

  if (error) {
    console.error('Erro ao buscar blocos:', error);
    throw error;
  }

  return data as Bloco[];
};

export const createBloco = async (bloco: BlocoCreateInput) => {
  const { data, error } = await supabase
    .from('blocos')
    .insert(bloco)
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar bloco:', error);
    toastService.error("Erro ao criar bloco", error.message);
    throw error;
  }

  toastService.success("Bloco criado", `${bloco.nome} foi adicionado com sucesso`);

  return data as Bloco;
};

export const renameBloco = async (blocoId: string, newName: string) => {
  const { data, error } = await supabase
    .from('blocos')
    .update({ nome: newName, updated_at: new Date().toISOString() })
    .eq('id', blocoId)
    .select()
    .single();
    
  if (error) {
    console.error('Erro ao renomear bloco:', error);
    throw error;
  }
  
  return data as Bloco;
};

export const deleteBloco = async (blocoId: string) => {
  // First delete all materias belonging to this block
  const { error: materiasDeleteError } = await supabase
    .from('materias')
    .delete()
    .eq('bloco_id', blocoId);
    
  if (materiasDeleteError) {
    console.error('Erro ao excluir matérias do bloco:', materiasDeleteError);
    throw materiasDeleteError;
  }
  
  // Then delete the block itself
  const { error } = await supabase
    .from('blocos')
    .delete()
    .eq('id', blocoId);
    
  if (error) {
    console.error('Erro ao excluir bloco:', error);
    throw error;
  }
  
  return true;
};
