
import { Materia } from '@/types';
import { toast } from '@/hooks/use-toast';

interface BlocoClipboard {
  id: string;
  nome: string;
  ordem: number;
  materias: Materia[];
  totalTime: number;
}

export const validatePasteOperation = (
  copiedMateria: Materia | null, 
  copiedBloco: BlocoClipboard | null,
  blocks: any[]
): boolean => {
  // Verificar se há algum conteúdo copiado
  if (!copiedMateria && !copiedBloco) {
    toast({
      title: "Nada para colar",
      description: "Não há matéria ou bloco na área de transferência",
      variant: "destructive"
    });
    return false;
  }

  // Verificar se há blocos disponíveis (apenas para matérias individuais)
  if (copiedMateria && !copiedBloco && blocks.length === 0) {
    toast({
      title: "Nenhum bloco disponível",
      description: "Crie um bloco primeiro para colar a matéria",
      variant: "destructive"
    });
    return false;
  }

  return true;
};
