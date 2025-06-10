
import { useCallback } from 'react';
import { Materia } from '@/types';
import { useClipboard } from '@/context/ClipboardContext';

export const useMateriaClipboard = () => {
  const { copyMaterias, pasteMaterias, hasCopiedMaterias, clearClipboard } = useClipboard();

  const copySelectedMaterias = useCallback((materias: Materia[]) => {
    if (materias.length > 0) {
      copyMaterias(materias);
    }
  }, [copyMaterias]);

  const pasteAtPosition = useCallback(async (targetMateriaId?: string, targetBlockId?: string) => {
    await pasteMaterias(targetMateriaId, targetBlockId);
  }, [pasteMaterias]);

  return {
    copySelectedMaterias,
    pasteAtPosition,
    hasCopiedMaterias,
    clearClipboard
  };
};
