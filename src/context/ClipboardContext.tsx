
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Materia } from '@/types';

interface ClipboardContextType {
  copiedMaterias: Materia[];
  copyMaterias: (materias: Materia[]) => void;
  pasteMaterias: (targetMateriaId?: string, targetBlockId?: string) => Promise<void>;
  hasCopiedMaterias: boolean;
  clearClipboard: () => void;
}

const ClipboardContext = createContext<ClipboardContextType | undefined>(undefined);

export const useClipboard = () => {
  const context = useContext(ClipboardContext);
  if (!context) {
    throw new Error('useClipboard must be used within a ClipboardProvider');
  }
  return context;
};

interface ClipboardProviderProps {
  children: React.ReactNode;
  onPasteMaterias?: (materias: Materia[], targetMateriaId?: string, targetBlockId?: string) => Promise<void>;
}

export const ClipboardProvider = ({ children, onPasteMaterias }: ClipboardProviderProps) => {
  const [copiedMaterias, setCopiedMaterias] = useState<Materia[]>([]);

  const copyMaterias = useCallback((materias: Materia[]) => {
    setCopiedMaterias(materias);
    console.log('Matérias copiadas:', materias.length);
  }, []);

  const pasteMaterias = useCallback(async (targetMateriaId?: string, targetBlockId?: string) => {
    if (copiedMaterias.length > 0 && onPasteMaterias) {
      await onPasteMaterias(copiedMaterias, targetMateriaId, targetBlockId);
      console.log('Matérias coladas:', copiedMaterias.length);
    }
  }, [copiedMaterias, onPasteMaterias]);

  const clearClipboard = useCallback(() => {
    setCopiedMaterias([]);
  }, []);

  const hasCopiedMaterias = copiedMaterias.length > 0;

  return (
    <ClipboardContext.Provider value={{
      copiedMaterias,
      copyMaterias,
      pasteMaterias,
      hasCopiedMaterias,
      clearClipboard
    }}>
      {children}
    </ClipboardContext.Provider>
  );
};
