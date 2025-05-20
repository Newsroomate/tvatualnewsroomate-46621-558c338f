
import { supabase } from "@/integrations/supabase/client";
import { Materia, MateriaCreateInput } from "@/types";
import { toastService } from "@/utils/toast-utils";
import { enableRealtimeForTable } from "@/integrations/supabase/enableRealtime";

// Enable realtime for materias table when the module is loaded
enableRealtimeForTable('materias')
  .then(success => {
    if (success) {
      console.log('Realtime enabled for materias table');
    } else {
      console.warn('Failed to enable realtime for materias table');
    }
  });

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

  // Add type assertion to handle database vs. interface mismatch
  return data.map(item => ({
    ...item,
    // Map retranca to titulo and vice versa if needed
    titulo: item.retranca || "Sem título"
  })) as Materia[];
};

export const createMateria = async (materia: MateriaCreateInput) => {
  const { data, error } = await supabase
    .from('materias')
    .insert(materia)
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar matéria:', error);
    toastService.error("Erro ao criar matéria", error.message);
    throw error;
  }

  toastService.success("Matéria criada", `${materia.retranca} foi adicionada com sucesso`);

  // Add type assertion with the necessary field
  return {
    ...data,
    titulo: data.retranca || "Sem título"
  } as Materia;
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
    toastService.error("Erro ao atualizar matéria", error.message);
    throw error;
  }

  toastService.success("Matéria atualizada", `Alterações salvas com sucesso`);

  // Add type assertion with the necessary field
  return {
    ...data,
    titulo: data.retranca || "Sem título"
  } as Materia;
};

export const deleteMateria = async (id: string) => {
  const { error } = await supabase
    .from('materias')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao excluir matéria:', error);
    toastService.error("Erro ao excluir matéria", error.message);
    throw error;
  }

  toastService.success("Matéria excluída", `A matéria foi removida com sucesso`);

  return true;
};
