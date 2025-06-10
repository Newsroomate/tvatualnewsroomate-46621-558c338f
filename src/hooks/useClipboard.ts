
import { useState, useEffect } from 'react';
import { Materia } from '@/types';
import { toast } from '@/hooks/use-toast';

export const useClipboard = () => {
  const [copiedMateria, setCopiedMateria] = useState<Materia | null>(null);

  const copyMateria = (materia: Materia) => {
    setCopiedMateria(materia);
    toast({
      title: "Matéria copiada",
      description: `"${materia.retranca}" foi copiada para a área de transferência`,
    });
  };

  const clearClipboard = () => {
    setCopiedMateria(null);
  };

  const hasCopiedMateria = () => {
    return copiedMateria !== null;
  };

  return {
    copiedMateria,
    copyMateria,
    clearClipboard,
    hasCopiedMateria
  };
};
