import { supabase } from "@/integrations/supabase/client";

export interface Reportagem {
  id: string;
  telejornal_id: string;
  retranca: string;
  corpo_materia?: string;
  reporter?: string;
  local?: string;
  status: string;
  data_gravacao?: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export const fetchReportagensByTelejornal = async (telejornalId: string): Promise<Reportagem[]> => {
  const { data, error } = await supabase
    .from('reportagens')
    .select('*')
    .eq('telejornal_id', telejornalId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Erro ao buscar reportagens:", error);
    throw error;
  }

  return data || [];
};

export const createReportagem = async (reportagem: Omit<Reportagem, 'id' | 'created_at' | 'updated_at'>): Promise<Reportagem> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('reportagens')
    .insert([{ ...reportagem, user_id: user?.id }])
    .select('*')
    .single();

  if (error) {
    console.error("Erro ao criar reportagem:", error);
    throw error;
  }

  return data as Reportagem;
};

export const updateReportagem = async (id: string, updates: Partial<Reportagem>): Promise<Reportagem> => {
  const { data, error } = await supabase
    .from('reportagens')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error("Erro ao atualizar reportagem:", error);
    throw error;
  }

  return data as Reportagem;
};

export const deleteReportagem = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('reportagens')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Erro ao deletar reportagem:", error);
    throw error;
  }
};
