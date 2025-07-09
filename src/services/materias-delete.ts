
import { supabase } from "@/integrations/supabase/client";
import { toastService } from "@/utils/toast-utils";

export const deleteMateria = async (id: string) => {
  console.log('Attempting to delete materia with ID:', id);
  
  try {
    const { error, data } = await supabase
      .from('materias')
      .delete()
      .eq('id', id)
      .select(); // Add select to see if anything was actually deleted

    if (error) {
      console.error('Supabase error deleting materia:', error);
      
      // Handle specific RLS errors
      if (error.code === '42501' || error.message.includes('row-level security')) {
        throw new Error('Você não tem permissão para excluir esta matéria. Apenas o Editor-Chefe pode realizar esta ação.');
      }
      
      throw error;
    }

    // Check if any rows were actually deleted
    if (!data || data.length === 0) {
      console.warn('No rows were deleted. This might indicate a permission issue.');
      throw new Error('A matéria não foi excluída. Verifique suas permissões.');
    }

    console.log('Successfully deleted materia:', data);
    return true;
  } catch (error: any) {
    console.error('Error in deleteMateria function:', error);
    throw error;
  }
};
