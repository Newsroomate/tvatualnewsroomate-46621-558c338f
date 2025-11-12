import { supabase } from "@/integrations/supabase/client";
import { Materia, MateriaCreateInput } from "@/types";
import { toastService } from "@/utils/toast-utils";

export const updateMateria = async (id: string, updates: Partial<Materia>) => {
  // Validate that ID exists
  if (!id) {
    const error = new Error('ID da matéria é obrigatório para atualização');
    console.error('updateMateria: Missing ID', { id, updates });
    throw error;
  }

  // Create a copy of the updates object to avoid modifying the original
  const updatesToSend = { ...updates };
  
  // Remove fields that don't exist in the database
  const nonDbFields = ['titulo', 'equipamento', 'horario_exibicao'];
  nonDbFields.forEach(field => {
    // @ts-ignore - Remove non-database fields
    delete updatesToSend[field];
  });
  
  // Ensure retranca is included since it's a required field in the database
  if (updatesToSend.retranca === undefined || updatesToSend.retranca === null || updatesToSend.retranca.trim() === '') {
    console.error('updateMateria: Missing or empty retranca field', { id, updates });
    throw new Error('Retranca é obrigatória para atualizar uma matéria');
  }
  
  console.log('updateMateria: Sending updates to database:', { id, updates: updatesToSend });

  // First, check if the materia exists
  const { data: existingMateria, error: checkError } = await supabase
    .from('materias')
    .select('id, retranca, bloco_id')
    .eq('id', id)
    .maybeSingle();

  if (checkError) {
    console.error('updateMateria: Error checking if materia exists:', checkError);
    throw new Error(`Erro ao verificar se a matéria existe: ${checkError.message}`);
  }

  // If materia doesn't exist, create it from the snapshot data
  if (!existingMateria) {
    console.log('updateMateria: Materia not found, creating new one from snapshot data:', { id });
    
     // Prepare data for creation
      const createData: any = {
       retranca: updatesToSend.retranca,
       bloco_id: updatesToSend.bloco_id || '',
       ordem: updatesToSend.ordem || 1,
       duracao: updatesToSend.duracao || 0,
       clip: updatesToSend.clip,
       pagina: updatesToSend.pagina,
       reporter: updatesToSend.reporter,
        status: updatesToSend.status || 'draft',
        // Note: 'observacoes', 'lauda', and 'teleprompter' fields removed - don't exist in materias table (only in materias_snapshots)
         gc: updatesToSend.gc,
        local_gravacao: updatesToSend.local_gravacao,
       tempo_clip: updatesToSend.tempo_clip,
       tipo_material: updatesToSend.tipo_material,
       tags: updatesToSend.tags,
       cabeca: updatesToSend.cabeca,  // Save cabeca directly
       texto: updatesToSend.texto     // Save texto directly
     };

    // Create the materia with the specific ID
    const { data: createdMateria, error: createError } = await supabase
      .from('materias')
      .insert({ ...createData, id })
      .select()
      .single();

    if (createError) {
      console.error('updateMateria: Error creating materia from snapshot:', createError);
      throw new Error(`Erro ao criar matéria a partir do snapshot: ${createError.message}`);
    }

    console.log('updateMateria: Successfully created materia from snapshot:', createdMateria);
    
    return {
      ...createdMateria,
      titulo: createdMateria.retranca || "Sem título"
    } as Materia;
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