import { useEffect, useRef } from 'react';
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
  
  const pasteMateria = async (targetBlockId?: string) => {
    // Usar o sistema unificado para colar matéria
    const result = await unifiedClipboard.pasteMateria(typeof targetBlockId === 'string' ? targetBlockId : undefined);
    
    if (result.success) {
      console.log('Matéria colada com sucesso via sistema unificado');
    } else {
      console.error('Erro ao colar matéria:', result.error);
    }
  };

  const pasteRef = useRef(pasteMateria);
  pasteRef.current = pasteMateria;
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<{ blockId: string }>).detail?.blockId;
      if (id) pasteRef.current(id);
    };
    window.addEventListener('paste-materia-into-block', handler);
    return () => window.removeEventListener('paste-materia-into-block', handler);
  }, []);

  return { pasteMateria };
};
