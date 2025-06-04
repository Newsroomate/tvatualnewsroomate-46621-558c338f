
import { supabase } from "@/integrations/supabase/client";
import { ModeloEspelho, ModeloEspelhoCreateInput } from "@/types/models";

export const createModelo = async (modelo: ModeloEspelhoCreateInput): Promise<ModeloEspelho> => {
  const { data, error } = await supabase
    .from('modelos_espelho')
    .insert([modelo])
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar modelo:', error);
    throw error;
  }

  return data;
};

export const getModelos = async (): Promise<ModeloEspelho[]> => {
  const { data, error } = await supabase
    .from('modelos_espelho')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar modelos:', error);
    throw error;
  }

  return data || [];
};

export const deleteModelo = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('modelos_espelho')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao deletar modelo:', error);
    throw error;
  }
};

export const updateModelo = async (id: string, updates: Partial<ModeloEspelhoCreateInput>): Promise<ModeloEspelho> => {
  const { data, error } = await supabase
    .from('modelos_espelho')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar modelo:', error);
    throw error;
  }

  return data;
};
