
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
  const { data, error } = await supabase
    .from('pautas')
    .insert(pauta)
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
