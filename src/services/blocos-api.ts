
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

export const updateBlocoName = async (blocoId: string, newName: string) => {
  const { data, error } = await supabase
    .from('blocos')
    .update({ nome: newName })
    .eq('id', blocoId)
    .select()
    .single();

  if (error) {
    console.error('Erro ao renomear bloco:', error);
    toastService.error("Erro ao renomear bloco", error.message);
    throw error;
  }

  toastService.success("Bloco renomeado", `O bloco foi renomeado para ${newName}`);

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

  toastService.success("Bloco excluído", "O bloco foi excluído com sucesso");
};
