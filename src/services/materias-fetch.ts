
import { supabase } from "@/integrations/supabase/client";
import { Materia } from "@/types";

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
