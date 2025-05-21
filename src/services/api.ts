import { supabase } from "@/integrations/supabase/client";
import { Telejornal, Materia, Pauta, MateriaCreateInput, PautaCreateInput } from "@/types";

export const fetchTelejornais = async (): Promise<Telejornal[]> => {
  try {
    const { data: telejornais, error } = await supabase
      .from('telejornais')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Erro ao buscar telejornais:", error);
      return [];
    }

    return telejornais || [];
  } catch (error) {
    console.error("Erro ao buscar telejornais:", error);
    return [];
  }
};

export const fetchMateriasByBloco = async (blocoId: string): Promise<Materia[]> => {
  try {
    const { data: materias, error } = await supabase
      .from('materias')
      .select('*')
      .eq('bloco_id', blocoId)
      .order('ordem', { ascending: true });

    if (error) {
      console.error(`Erro ao buscar matérias do bloco ${blocoId}:`, error);
      return [];
    }

    return materias || [];
  } catch (error) {
    console.error(`Erro ao buscar matérias do bloco ${blocoId}:`, error);
    return [];
  }
};

export const createMateria = async (materia: MateriaCreateInput): Promise<Materia> => {
  try {
    const { data, error } = await supabase
      .from('materias')
      .insert([materia])
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar matéria:", error);
      throw error;
    }

    return data as Materia;
  } catch (error) {
    console.error("Erro ao criar matéria:", error);
    throw error;
  }
};

export const updateMateria = async (id: string, updates: Partial<Materia>): Promise<Materia | null> => {
  try {
    const { data, error } = await supabase
      .from('materias')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Erro ao atualizar matéria ${id}:`, error);
      throw error;
    }

    return data as Materia;
  } catch (error) {
    console.error(`Erro ao atualizar matéria ${id}:`, error);
    return null;
  }
};

export const deleteMateria = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('materias')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Erro ao deletar matéria ${id}:`, error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error(`Erro ao deletar matéria ${id}:`, error);
    return false;
  }
};

export const fetchPautas = async (): Promise<Pauta[]> => {
  try {
    const { data: pautas, error } = await supabase
      .from('pautas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Erro ao buscar pautas:", error);
      return [];
    }

    return pautas || [];
  } catch (error) {
    console.error("Erro ao buscar pautas:", error);
    return [];
  }
};

export const createPauta = async (pauta: PautaCreateInput): Promise<Pauta> => {
  try {
    const { data, error } = await supabase
      .from('pautas')
      .insert([pauta])
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar pauta:", error);
      throw error;
    }

    return data as Pauta;
  } catch (error) {
    console.error("Erro ao criar pauta:", error);
    throw error;
  }
};

// Re-export functions from blocos-api
export { 
  fetchBlocosByTelejornal,
  createBloco,
  renameBloco,
  deleteBloco
} from './blocos-api';
