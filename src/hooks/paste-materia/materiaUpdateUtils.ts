
import { Materia } from '@/types';
import { updateMateria } from '@/services/materias-api';

/**
 * Utility functions for updating materia orders in the database
 */
export const materiaUpdateUtils = {
  /**
   * Update orders of materias in the database
   */
  updateMateriasOrders: async (materiasToUpdate: Materia[]): Promise<void> => {
    if (materiasToUpdate.length === 0) return;
    
    const updatePromises = materiasToUpdate.map(materia => 
      updateMateria(materia.id, { ordem: materia.ordem })
    );
    await Promise.all(updatePromises);
  }
};
