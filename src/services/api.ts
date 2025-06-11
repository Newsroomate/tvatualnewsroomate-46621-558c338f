import { supabase } from "@/integrations/supabase/client";
import { Telejornal, Bloco, Materia, Pauta, PautaCreateInput } from "@/types";
import { TablesInsert } from "@/integrations/supabase/types";
import { ClosedRundown } from "@/services/espelhos-api";

export const fetchTelejornais = async (): Promise<Telejornal[]> => {
  const { data, error } = await supabase
    .from('telejornais')
    .select('*')
    .order('nome', { ascending: true });

  if (error) {
    console.error("Erro ao buscar telejornais:", error);
    throw error;
  }

  return data || [];
};

export const createTelejornal = async (telejornal: TablesInsert<'telejornais'>): Promise<Telejornal> => {
  const { data, error } = await supabase
    .from('telejornais')
    .insert([telejornal])
    .select('*')
    .single();

  if (error) {
    console.error("Erro ao criar telejornal:", error);
    throw error;
  }

  return data as Telejornal;
};

export const updateTelejornal = async (id: string, updates: TablesInsert<'telejornais'>): Promise<Telejornal | null> => {
  const { data, error } = await supabase
    .from('telejornais')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error("Erro ao atualizar telejornal:", error);
    throw error;
  }

  return data as Telejornal;
};

export const deleteTelejornal = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('telejornais')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Erro ao deletar telejornal:", error);
    throw error;
  }
};

// Add the missing fetchTelejornal function
export const fetchTelejornal = async (id: string): Promise<Telejornal | null> => {
  const { data, error } = await supabase
    .from('telejornais')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Erro ao buscar telejornal ${id}:`, error);
    throw error;
  }

  return data as Telejornal;
};

export const fetchBlocosByTelejornal = async (telejornalId: string): Promise<Bloco[]> => {
  const { data, error } = await supabase
    .from('blocos')
    .select('*')
    .eq('telejornal_id', telejornalId)
    .order('ordem', { ascending: true });

  if (error) {
    console.error(`Erro ao buscar blocos para o telejornal ${telejornalId}:`, error);
    return [];
  }

  return data || [];
};

export const createBloco = async (bloco: TablesInsert<'blocos'>): Promise<Bloco> => {
  const { data, error } = await supabase
    .from('blocos')
    .insert([bloco])
    .select('*')
    .single();

  if (error) {
    console.error("Erro ao criar bloco:", error);
    throw error;
  }

  return data as Bloco;
};

export const updateBloco = async (id: string, updates: TablesInsert<'blocos'>): Promise<Bloco | null> => {
  const { data, error } = await supabase
    .from('blocos')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error("Erro ao atualizar bloco:", error);
    throw error;
  }

  return data as Bloco;
};

export const deleteBloco = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('blocos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Erro ao deletar bloco:", error);
    throw error;
  }
};

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

// Export the pautas-api functions 
export { 
  fetchPautas, 
  createPauta, 
  updatePauta, 
  deletePauta 
} from "./pautas-api";

// Export the espelhos-api functions
export { fetchClosedRundowns } from "./espelhos-api";

// Export the blocos-api functions including deleteAllBlocos
export { deleteAllBlocos } from "./blocos-api";

// Export the snapshots-api functions
export { fetchClosedRundownSnapshots } from "./snapshots-api";
