
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Materia } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface ClipboardContextType {
  copiedMaterias: Materia[];
  copyMaterias: (materias: Materia[]) => void;
  clearClipboard: () => void;
  hasCopiedMaterias: boolean;
}

const ClipboardContext = createContext<ClipboardContextType | undefined>(undefined);

export const ClipboardProvider = ({ children }: { children: React.ReactNode }) => {
  const [copiedMaterias, setCopiedMaterias] = useState<Materia[]>([]);
  const { toast } = useToast();

  const copyMaterias = (materias: Materia[]) => {
    setCopiedMaterias(materias);
    toast({
      title: "Matérias copiadas",
      description: `${materias.length} matéria(s) copiada(s) para a área de transferência`,
    });
  };

  const clearClipboard = () => {
    setCopiedMaterias([]);
  };

  const hasCopiedMaterias = copiedMaterias.length > 0;

  // Handle global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle Ctrl+C and Ctrl+V, let components handle their own logic
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 'c' || event.key === 'v') {
          // These will be handled by individual components
          // This context just provides the state management
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ClipboardContext.Provider value={{
      copiedMaterias,
      copyMaterias,
      clearClipboard,
      hasCopiedMaterias
    }}>
      {children}
    </ClipboardContext.Provider>
  );
};

export const useClipboard = () => {
  const context = useContext(ClipboardContext);
  if (context === undefined) {
    throw new Error('useClipboard must be used within a ClipboardProvider');
  }
  return context;
};
