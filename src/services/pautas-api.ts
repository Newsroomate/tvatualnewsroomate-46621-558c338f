
import { supabase } from "@/integrations/supabase/client";
import { Pauta, PautaCreateInput } from "@/types";

export const fetchPautas = async () => {
  const { data, error } = await supabase
    .from('pautas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar pautas:', error);
    throw error;
  }

  return data as Pauta[];
};

export const createPauta = async (pauta: PautaCreateInput) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const pautaWithUserId = {
    ...pauta,
    user_id: user.id
  };

  const { data, error } = await supabase
    .from('pautas')
    .insert(pautaWithUserId)
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar pauta:', error);
    throw error;
  }

  return data as Pauta;
};

export const updatePauta = async (id: string, updates: { 
  titulo: string;
  descricao?: string;
  local?: string;
  horario?: string;
  entrevistado?: string;
  produtor?: string;
  proposta?: string;
  encaminhamento?: string;
  informacoes?: string;
}) => {
  const { data, error } = await supabase
    .from('pautas')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar pauta:', error);
    throw error;
  }

  return data as Pauta;
};

export const deletePauta = async (id: string) => {
  const { error } = await supabase
    .from('pautas')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao excluir pauta:', error);
    throw error;
  }

  return true;
};
