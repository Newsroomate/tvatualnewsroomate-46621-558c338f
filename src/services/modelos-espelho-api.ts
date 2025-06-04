
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
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError || !userData.user) {
    console.error('Erro ao obter usuário:', userError);
    toastService.error("Erro de autenticação", "Usuário não autenticado");
    throw new Error("Usuário não autenticado");
  }

  const { data, error } = await supabase
    .from('modelos_espelho')
    .insert({
      ...modelo,
      user_id: userData.user.id
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar modelo de espelho:', error);
    let errorMessage = "Erro desconhecido";
    
    if (error.code === '23505') {
      errorMessage = "Já existe um modelo com este nome";
    } else if (error.code === '23503') {
      errorMessage = "Telejornal não encontrado";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    toastService.error("Erro ao salvar modelo", errorMessage);
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
