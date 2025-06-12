
import { Materia } from '@/types';
import { toast } from '@/hooks/use-toast';

export const validatePasteOperation = (
  copiedMateria: Materia | null,
  blocks: any[]
): boolean => {
  if (!copiedMateria) {
    console.log('Tentativa de colar sem matéria copiada');
    toast({
      title: "Nenhuma matéria copiada",
      description: "Copie uma matéria primeiro no Espelho Geral usando Ctrl+C",
      variant: "destructive"
    });
    return false;
  }

  if (!copiedMateria.retranca) {
    console.error('Matéria copiada não possui retranca:', copiedMateria);
    toast({
      title: "Erro na matéria copiada",
      description: "A matéria copiada não possui dados válidos",
      variant: "destructive"
    });
    return false;
  }

  if (blocks.length === 0) {
    toast({
      title: "Erro ao colar",
      description: "Nenhum bloco disponível para colar a matéria",
      variant: "destructive"
    });
    return false;
  }

  return true;
};
