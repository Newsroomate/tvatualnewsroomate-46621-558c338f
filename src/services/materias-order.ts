
import { supabase } from "@/integrations/supabase/client";
import { Materia } from "@/types";
import { toastService } from "@/utils/toast-utils";

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
  
  // Add the titulo property to each returned item
  return data.map(item => ({
    ...item,
    titulo: item.retranca || "Sem título"
  })) as Materia[];
};
