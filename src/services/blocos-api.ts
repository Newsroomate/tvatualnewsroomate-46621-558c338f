
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
