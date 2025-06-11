
import { Materia } from '@/types';
import { toast } from '@/hooks/use-toast';

/**
 * Validation utilities for paste operations
 */
export const pasteValidation = {
  /**
   * Validate if paste operation can proceed
   */
  validatePasteOperation: (copiedMateria: Materia | null, selectedMateria: Materia | null): boolean => {
    if (!copiedMateria) {
      toast({
        title: "Nenhuma matéria copiada",
        description: "Copie uma matéria primeiro usando Ctrl+C",
        variant: "destructive"
      });
      return false;
    }

    if (!selectedMateria) {
      toast({
        title: "Nenhuma matéria selecionada",
        description: "Selecione uma matéria primeiro para colar abaixo dela",
        variant: "destructive"
      });
      return false;
    }

    return true;
  }
};
