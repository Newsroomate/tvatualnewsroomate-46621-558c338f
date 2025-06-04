
import { supabase } from "@/integrations/supabase/client";
import { EspelhoModelo, EspelhoModeloCreateInput } from "@/types/models";

export const fetchModelos = async (): Promise<EspelhoModelo[]> => {
  const { data, error } = await supabase
    .from('espelhos_modelos')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Erro ao buscar modelos:', error);
    throw error;
  }
  
  return data || [];
};

export const fetchModelosByTelejornal = async (telejornalId: string): Promise<EspelhoModelo[]> => {
  const { data, error } = await supabase
    .from('espelhos_modelos')
    .select('*')
    .eq('telejornal_id', telejornalId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Erro ao buscar modelos por telejornal:', error);
    throw error;
  }
  
  return data || [];
};

export const createModelo = async (modelo: EspelhoModeloCreateInput): Promise<EspelhoModelo> => {
  const { data, error } = await supabase
    .from('espelhos_modelos')
    .insert(modelo)
    .select()
    .single();
  
  if (error) {
    console.error('Erro ao criar modelo:', error);
    throw error;
  }
  
  return data;
};

export const deleteModelo = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('espelhos_modelos')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Erro ao deletar modelo:', error);
    throw error;
  }
};
