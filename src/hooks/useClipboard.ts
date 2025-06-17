
import { useState } from 'react';
import { Materia } from '@/types';
import { toast } from './use-toast';

interface BlocoClipboard {
  id: string;
  nome: string;
  ordem: number;
  materias: Materia[];
  totalTime: number;
}

export const useClipboard = () => {
  const [copiedMateria, setCopiedMateria] = useState<Materia | null>(null);
  const [copiedBloco, setCopiedBloco] = useState<BlocoClipboard | null>(null);

  const copyMateria = (materia: Materia) => {
    setCopiedMateria(materia);
    setCopiedBloco(null); // Clear any copied block
    console.log('Matéria copiada:', materia);
  };

  const copyBloco = (bloco: BlocoClipboard) => {
    setCopiedBloco(bloco);
    setCopiedMateria(null); // Clear any copied materia
    console.log('Bloco copiado:', bloco);
    
    toast({
      title: "Bloco copiado",
      description: `Bloco "${bloco.nome}" com ${bloco.materias.length} matérias foi copiado. Use Ctrl+V para colar em outro jornal.`,
    });
  };

  const clearClipboard = () => {
    setCopiedMateria(null);
    setCopiedBloco(null);
  };

  const hasCopiedMateria = copiedMateria !== null;
  const hasCopiedBloco = copiedBloco !== null;
  const hasClipboardData = hasCopiedMateria || hasCopiedBloco;

  return {
    copiedMateria,
    copiedBloco,
    copyMateria,
    copyBloco,
    clearClipboard,
    hasCopiedMateria,
    hasCopiedBloco,
    hasClipboardData
  };
};
