
import { supabase } from "@/integrations/supabase/client";
import { Materia, MateriaCreateInput } from "@/types";
import { toast } from "@/hooks/use-toast";

export const fetchMateriasByBloco = async (blocoId: string) => {
  const { data, error } = await supabase
    .from('materias')
    .select('*')
    .eq('bloco_id', blocoId)
    .order('ordem');

  if (error) {
    console.error('Erro ao buscar matérias:', error);
    throw error;
  }

  return data as Materia[];
};

export const createMateria = async (materia: MateriaCreateInput) => {
  const { data, error } = await supabase
    .from('materias')
    .insert(materia)
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar matéria:', error);
    toast({
      title: "Erro ao criar matéria",
      description: error.message,
      variant: "destructive",
    });
    throw error;
  }

  toast({
    title: "Matéria criada",
    description: `${materia.retranca} foi adicionada com sucesso`,
  });

  return data as Materia;
};

export const updateMateria = async (id: string, updates: Partial<Materia>) => {
  const { data, error } = await supabase
    .from('materias')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar matéria:', error);
    toast({
      title: "Erro ao atualizar matéria",
      description: error.message,
      variant: "destructive",
    });
    throw error;
  }

  toast({
    title: "Matéria atualizada",
    description: `Alterações salvas com sucesso`,
  });

  return data as Materia;
};

export const deleteMateria = async (id: string) => {
  const { error } = await supabase
    .from('materias')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao excluir matéria:', error);
    toast({
      title: "Erro ao excluir matéria",
      description: error.message,
      variant: "destructive",
    });
    throw error;
  }

  toast({
    title: "Matéria excluída",
    description: `A matéria foi removida com sucesso`,
  });

  return true;
};
