
import { supabase } from "@/integrations/supabase/client";
import { Pauta, PautaCreateInput } from "@/types";
import { useToast } from "@/hooks/use-toast";

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
    useToast().toast({
      title: "Erro ao criar pauta",
      description: error.message,
      variant: "destructive",
    });
    throw error;
  }

  useToast().toast({
    title: "Pauta criada",
    description: `${pauta.titulo} foi adicionada com sucesso`,
  });

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
    useToast().toast({
      title: "Erro ao atualizar pauta",
      description: error.message,
      variant: "destructive",
    });
    throw error;
  }

  useToast().toast({
    title: "Pauta atualizada",
    description: `${updates.titulo} foi atualizada com sucesso`,
  });

  return data as Pauta;
};

export const deletePauta = async (id: string) => {
  const { error } = await supabase
    .from('pautas')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao excluir pauta:', error);
    useToast().toast({
      title: "Erro ao excluir pauta",
      description: error.message,
      variant: "destructive",
    });
    throw error;
  }

  useToast().toast({
    title: "Pauta excluída",
    description: "A pauta foi removida com sucesso",
  });

  return true;
};
