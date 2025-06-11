
import { supabase } from "@/integrations/supabase/client";
import { toastService } from "@/utils/toast-utils";

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
