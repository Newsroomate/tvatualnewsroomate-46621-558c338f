
import { supabase } from "@/integrations/supabase/client";
import { Materia, MateriaCreateInput } from "@/types";
import { TablesInsert } from "@/integrations/supabase/types";

export const fetchMateriasByBloco = async (blocoId: string): Promise<Materia[]> => {
  const { data, error } = await supabase
    .from('materias')
    .select('*')
    .eq('bloco_id', blocoId)
    .order('ordem', { ascending: true });

  if (error) {
    console.error(`Erro ao buscar matérias para o bloco ${blocoId}:`, error);
    return [];
  }

  // Map the data to include the titulo property that's required by the Materia type
  return data.map(item => ({
    ...item,
    titulo: item.retranca || "Sem título" // Add the missing titulo property
  })) as Materia[];
};

export const createMateria = async (materia: TablesInsert<'materias'>): Promise<Materia> => {
  const { data, error } = await supabase
    .from('materias')
    .insert([materia])
    .select('*')
    .single();

  if (error) {
    console.error("Erro ao criar matéria:", error);
    throw error;
  }

  return {
    ...data,
    titulo: data.retranca || "Sem título"
  } as Materia;
};

export const updateMateria = async (id: string, updates: TablesInsert<'materias'>): Promise<Materia | null> => {
  const { data, error } = await supabase
    .from('materias')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error("Erro ao atualizar matéria:", error);
    throw error;
  }

  return {
    ...data,
    titulo: data.retranca || "Sem título"
  } as Materia;
};

export const deleteMateria = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('materias')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Erro ao deletar matéria:", error);
    throw error;
  }
};

export const updateMateriasOrdem = async (materias: Partial<Materia>[]): Promise<Materia[]> => {
  // Filter out entries that don't have both id and ordem
  const validUpdates = materias.filter(materia => 
    materia.id !== undefined);
  
  const updates = validUpdates.map(materia => {
    // Create a proper update object that includes ordem as required
    const updateData: any = {
      id: materia.id,
      ordem: materia.ordem || 0, // Ensure ordem is provided with a default value
    };
    
    // Include other fields if they're present
    if (materia.bloco_id !== undefined) updateData.bloco_id = materia.bloco_id;
    if (materia.retranca !== undefined) updateData.retranca = materia.retranca;
    else updateData.retranca = "Sem título"; // Default value for retranca
    
    return updateData;
  });
  
  if (updates.length === 0) {
    return [];
  }
  
  const { data, error } = await supabase
    .from('materias')
    .upsert(updates)
    .select();

  if (error) {
    console.error('Erro ao reordenar matérias:', error);
    throw error;
  }
  
  // Add the titulo property to each returned item
  return data.map(item => ({
    ...item,
    titulo: item.retranca || "Sem título"
  })) as Materia[];
};
