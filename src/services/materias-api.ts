
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

  // Map database response to our application model
  return {
    ...data,
    titulo: data.retranca || "Sem título"
  } as Materia;
};

export const updateMateria = async (id: string, updates: Partial<Materia>) => {
  // Validate that ID exists
  if (!id) {
    const error = new Error('ID da matéria é obrigatório para atualização');
    console.error('updateMateria: Missing ID', { id, updates });
    throw error;
  }

  // Create a copy of the updates object to avoid modifying the original
  const updatesToSend = { ...updates };
  
  // Remove any 'titulo' field from updates as it doesn't exist in the database
  // @ts-ignore - Remove titulo property if it exists
  delete updatesToSend.titulo;
  
  // Ensure retranca is included since it's a required field in the database
  if (updatesToSend.retranca === undefined || updatesToSend.retranca === null || updatesToSend.retranca.trim() === '') {
    console.error('updateMateria: Missing or empty retranca field', { id, updates });
    throw new Error('Retranca é obrigatória para atualizar uma matéria');
  }
  
  console.log('updateMateria: Sending updates to database:', { id, updates: updatesToSend });

  // First, check if the materia exists
  const { data: existingMateria, error: checkError } = await supabase
    .from('materias')
    .select('id, retranca')
    .eq('id', id)
    .maybeSingle();

  if (checkError) {
    console.error('updateMateria: Error checking if materia exists:', checkError);
    throw new Error(`Erro ao verificar se a matéria existe: ${checkError.message}`);
  }

  if (!existingMateria) {
    console.error('updateMateria: Materia not found:', { id });
    throw new Error('Matéria não encontrada');
  }

  console.log('updateMateria: Found existing materia:', existingMateria);

  // Check for potential duplicates
  const { data: duplicates, error: duplicateError } = await supabase
    .from('materias')
    .select('id, retranca')
    .eq('id', id);

  if (duplicateError) {
    console.warn('updateMateria: Error checking for duplicates:', duplicateError);
  } else if (duplicates && duplicates.length > 1) {
    console.warn('updateMateria: Multiple records found with same ID:', { id, count: duplicates.length, duplicates });
    toastService.error("Aviso", "Detectados registros duplicados. Entre em contato com o suporte.");
  }

  // Perform the update using maybeSingle() instead of single()
  const { data, error } = await supabase
    .from('materias')
    .update(updatesToSend)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    console.error('updateMateria: Database error during update:', error);
    const errorMessage = error.message || 'Erro desconhecido ao atualizar matéria';
    toastService.error("Erro ao atualizar matéria", errorMessage);
    throw new Error(`Erro ao atualizar matéria: ${errorMessage}`);
  }

  if (!data) {
    console.error('updateMateria: No data returned after update:', { id });
    throw new Error('Nenhum dado retornado após a atualização da matéria');
  }

  // Map database response to our application model
  const updatedMateria = {
    ...data,
    titulo: data.retranca || "Sem título"
  } as Materia;
  
  console.log('updateMateria: Successfully updated materia:', updatedMateria);
  
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
    if (materia.tempo_clip !== undefined) updateData.tempo_clip = materia.tempo_clip;
    if (materia.duracao !== undefined) updateData.duracao = materia.duracao;
    if (materia.texto !== undefined) updateData.texto = materia.texto;
    if (materia.cabeca !== undefined) updateData.cabeca = materia.cabeca;
    if (materia.status !== undefined) updateData.status = materia.status;
    if (materia.pagina !== undefined) updateData.pagina = materia.pagina;
    if (materia.reporter !== undefined) updateData.reporter = materia.reporter;
    if (materia.tipo_material !== undefined) updateData.tipo_material = materia.tipo_material;
    
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
