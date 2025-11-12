
import { useUnifiedClipboard } from '../unified-clipboard';
import { UsePasteMateriaProps } from './types';

export const usePasteMateria = ({
  blocks,
  setBlocks,
  selectedMateria,
  copiedMateria,
  clearClipboard,
  markOptimisticUpdate
}: UsePasteMateriaProps) => {
  
  const unifiedClipboard = useUnifiedClipboard({
    blocks,
    setBlocks,
    selectedMateria,
    markOptimisticUpdate
  });
  
  const pasteMateria = async () => {
    // Usar o sistema unificado para colar matéria
    const result = await unifiedClipboard.pasteMateria();
    
    if (result.success) {
      console.log('Matéria colada com sucesso via sistema unificado');
    } else {
      console.error('Erro ao colar matéria:', result.error);
    }
  };

  return { pasteMateria };
};
