
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

  // Map database fields to our application model
  return data.map(item => ({
    ...item,
    // Map retranca to titulo for UI consistency
    titulo: item.retranca || "Sem título"
  })) as Materia[];
};

export const createMateria = async (materia: MateriaCreateInput) => {
  // Remove any titulo field if it exists, as it's not in the database schema
  const materiaToCreate = { ...materia };
  // @ts-ignore - Remove titulo property if it exists
  delete materiaToCreate.titulo;

  const { data, error } = await supabase
    .from('materias')
    .insert(materiaToCreate)
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar matéria:', error);
    toastService.error("Erro ao criar matéria", error.message);
    throw error;
  }

  toastService.success("Matéria criada", `${materia.retranca} foi adicionada com sucesso`);

  // Map database response to our application model
  return {
    ...data,
    titulo: data.retranca || "Sem título"
  } as Materia;
};

export const updateMateria = async (id: string, updates: Partial<Materia>) => {
  // Create a copy of the updates object to avoid modifying the original
  const updatesToSend = { ...updates };
  
  // Remove any 'titulo' field from updates as it doesn't exist in the database
  // @ts-ignore - Remove titulo property if it exists
  delete updatesToSend.titulo;
  
  // Ensure retranca is included since it's a required field in the database
  if (updatesToSend.retranca === undefined) {
    console.error('Missing required field retranca in updateMateria');
    throw new Error('Retranca field is required when updating a materia');
  }
  
  console.log('Sending updates to database:', updatesToSend);

  const { data, error } = await supabase
    .from('materias')
    .update(updatesToSend)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar matéria:', error);
    toastService.error("Erro ao atualizar matéria", error.message);
    throw error;
  }

  toastService.success("Matéria atualizada", `Alterações salvas com sucesso`);

  // Map database response to our application model
  const updatedMateria = {
    ...data,
    titulo: data.retranca || "Sem título"
  } as Materia;
  
  console.log('Matéria atualizada:', updatedMateria);
  
  return updatedMateria;
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

// Updated function to properly handle type requirements
export const updateMateriasOrdem = async (materias: Partial<Materia>[]) => {
  // Filter out entries that don't have both id and ordem, which are required
  const validUpdates = materias.filter(materia => 
    materia.id !== undefined && materia.ordem !== undefined);
  
  // Make sure each entry has the required fields according to the database schema
  const updates = validUpdates.map(materia => {
    // Ensure the required fields are always present
    const updateData: any = {
      id: materia.id,
      ordem: materia.ordem,
    };
    
    // If bloco_id is present, include it
    if (materia.bloco_id !== undefined) {
      updateData.bloco_id = materia.bloco_id;
    }
    
    // For the retranca field which is required by the DB schema but might not be in our update
    // We need to query for the existing value or provide a default
    // Since we're just updating ordem, we can use a default if needed
    updateData.retranca = materia.retranca || "Sem título";
    
    // Include any other fields that were provided in the update
    if (materia.clip !== undefined) updateData.clip = materia.clip;
    if (materia.duracao !== undefined) updateData.duracao = materia.duracao;
    if (materia.texto !== undefined) updateData.texto = materia.texto;
    if (materia.cabeca !== undefined) updateData.cabeca = materia.cabeca;
    if (materia.status !== undefined) updateData.status = materia.status;
    if (materia.pagina !== undefined) updateData.pagina = materia.pagina;
    if (materia.reporter !== undefined) updateData.reporter = materia.reporter;
    
    return updateData;
  });
  
  // Log what we're sending to help with debugging
  console.log('Sending updates to database:', updates);
  
  if (updates.length === 0) {
    console.warn('No valid materia updates to send to database');
    return [];
  }
  
  const { data, error } = await supabase
    .from('materias')
    .upsert(updates)
    .select();

  if (error) {
    console.error('Erro ao reordenar matérias:', error);
    toastService.error("Erro ao reordenar matérias", error.message);
    throw error;
  }
  
  return data as Materia[];
};
