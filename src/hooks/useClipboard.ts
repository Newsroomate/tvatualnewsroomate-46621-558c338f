
import { Materia } from '@/types';
import { useUnifiedClipboard } from './unified-clipboard';

interface CopiedBlock {
  id: string;
  nome: string;
  ordem: number;
  materias: Materia[];
  is_copied_block: true;
}

// Hook de compatibilidade que usa o novo sistema unificado
export const useClipboard = () => {
  const unifiedClipboard = useUnifiedClipboard();

  return {
    copiedMateria: unifiedClipboard.copiedMateria,
    copiedBlock: unifiedClipboard.copiedBlock as CopiedBlock | null,
    copyMateria: unifiedClipboard.copyMateria,
    copyBlock: unifiedClipboard.copyBlock,
    clearClipboard: unifiedClipboard.clearClipboard,
    hasCopiedMateria: unifiedClipboard.hasCopiedMateria,
    hasCopiedBlock: unifiedClipboard.hasCopiedBlock,
    checkStoredMateria: unifiedClipboard.checkStoredMateria
  };
};
