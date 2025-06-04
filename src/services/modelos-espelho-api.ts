
import { supabase } from "@/integrations/supabase/client";
import { ModeloEspelho, ModeloEspelhoCreateInput } from "@/types/modelos-espelho";
import { toastService } from "@/utils/toast-utils";

export const fetchModelosEspelho = async (telejornalId?: string) => {
  let query = supabase
    .from('modelos_espelho')
    .select('*')
    .order('created_at', { ascending: false });

  if (telejornalId) {
    query = query.eq('telejornal_id', telejornalId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar modelos de espelho:', error);
    throw error;
  }

  return data as ModeloEspelho[];
};

export const createModeloEspelho = async (modelo: ModeloEspelhoCreateInput) => {
  const { data, error } = await supabase
    .from('modelos_espelho')
    .insert({
      ...modelo,
      criado_por: (await supabase.auth.getUser()).data.user?.id
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar modelo de espelho:', error);
    toastService.error("Erro ao salvar modelo", error.message);
    throw error;
  }

  toastService.success("Modelo salvo com sucesso!", `O modelo "${modelo.nome}" foi salvo`);
  return data as ModeloEspelho;
};

export const deleteModeloEspelho = async (id: string) => {
  const { error } = await supabase
    .from('modelos_espelho')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao excluir modelo de espelho:', error);
    toastService.error("Erro ao excluir modelo", error.message);
    throw error;
  }

  toastService.success("Modelo excluído", "O modelo foi excluído com sucesso");
  return true;
};
