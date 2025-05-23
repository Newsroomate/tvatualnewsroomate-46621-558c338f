
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

export const updateBloco = async (blocoId: string, updates: Partial<Bloco>) => {
  const { data, error } = await supabase
    .from('blocos')
    .update(updates)
    .eq('id', blocoId)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar bloco:', error);
    toastService.error("Erro ao atualizar bloco", error.message);
    throw error;
  }

  toastService.success("Bloco atualizado", "O nome do bloco foi alterado com sucesso");

  return data as Bloco;
};

export const deleteBloco = async (blocoId: string) => {
  const { error } = await supabase
    .from('blocos')
    .delete()
    .eq('id', blocoId);

  if (error) {
    console.error('Erro ao excluir bloco:', error);
    toastService.error("Erro ao excluir bloco", error.message);
    throw error;
  }

  toastService.success("Bloco excluído", "O bloco foi removido com sucesso");
};
