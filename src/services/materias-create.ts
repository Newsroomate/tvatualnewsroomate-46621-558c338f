
import { supabase } from "@/integrations/supabase/client";
import { Materia, MateriaCreateInput } from "@/types";
import { toastService } from "@/utils/toast-utils";

export const createMateria =  async (materia: MateriaCreateInput) => {
  // Remove any titulo field if it exists, as it's not in the database schema
  const materiaToCreate = { ...materia };
  // @ts-ignore - Remove titulo property if it exists
  delete materiaToCreate.titulo;
  
  // Clean up timestamp fields - convert empty strings to null
  if (materiaToCreate.horario_exibicao === '') {
    materiaToCreate.horario_exibicao = null;
  }

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
