
import { Materia } from '@/types';
import { toast } from '@/hooks/use-toast';

interface CopiedBlock {
  id: string;
  nome: string;
  ordem: number;
  materias: Materia[];
  is_copied_block: true;
}

export const validatePasteOperation = (
  copiedMateria: Materia | null,
  blocks: any[],
  copiedBlock?: CopiedBlock | null,
  getClipboardInfo?: () => { type: string; timestamp: number; age: number; data: string } | null
): boolean => {
  // Enhanced validation with clipboard info
  const clipboardInfo = getClipboardInfo?.();
  
  console.log('Validating paste operation:', {
    hasCopiedMateria: !!copiedMateria,
    hasCopiedBlock: !!copiedBlock,
    clipboardInfo,
    blocksCount: blocks.length
  });

  // Check if user is trying to paste a block instead of materia
  if (!copiedMateria && (copiedBlock || clipboardInfo?.type === 'block')) {
    console.log('Block detected in clipboard instead of materia');
    toast({
      title: "Bloco copiado detectado",
      description: `Um bloco "${clipboardInfo?.data || copiedBlock?.nome}" está copiado. Para colar blocos, use Ctrl+V com o cursor fora de qualquer matéria específica.`,
      variant: "destructive"
    });
    return false;
  }

  if (!copiedMateria) {
    console.log('No materia copied - showing appropriate message');
    
    // More specific message based on clipboard state
    if (clipboardInfo) {
      toast({
        title: "Nenhuma matéria copiada",
        description: `Clipboard contém: ${clipboardInfo.type === 'block' ? 'bloco' : 'item desconhecido'}. Copie uma matéria primeiro no Espelho Geral usando Ctrl+C.`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Nenhuma matéria copiada", 
        description: "Vá para o Espelho Geral, selecione uma matéria e use Ctrl+C para copiar.",
        variant: "destructive"
      });
    }
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
