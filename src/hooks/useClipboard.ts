
import { useState, useEffect } from 'react';
import { Materia } from '@/types';
import { toast } from '@/hooks/use-toast';

export const useClipboard = () => {
  const [copiedMateria, setCopiedMateria] = useState<Materia | null>(null);

  // Verificar se há matéria copiada no sessionStorage ao inicializar
  useEffect(() => {
    const storedMateria = sessionStorage.getItem('copiedMateria');
    if (storedMateria) {
      try {
        const parsedMateria = JSON.parse(storedMateria);
        setCopiedMateria(parsedMateria);
        console.log('Matéria copiada recuperada do sessionStorage:', parsedMateria);
      } catch (error) {
        console.error('Erro ao recuperar matéria copiada do sessionStorage:', error);
        sessionStorage.removeItem('copiedMateria');
      }
    }
  }, []);

  const copyMateria = (materia: Materia) => {
    console.log('Copiando matéria para clipboard global:', {
      id: materia.id,
      retranca: materia.retranca,
      texto: materia.texto,
      duracao: materia.duracao,
      todos_campos: materia
    });

    setCopiedMateria(materia);
    
    // Persistir no sessionStorage para manter entre modals/páginas
    try {
      sessionStorage.setItem('copiedMateria', JSON.stringify(materia));
      console.log('Matéria salva no sessionStorage para persistência');
    } catch (error) {
      console.error('Erro ao salvar matéria no sessionStorage:', error);
    }

    toast({
      title: "Matéria copiada",
      description: `"${materia.retranca}" foi copiada para a área de transferência com todos os campos preservados`,
    });
  };

  const clearClipboard = () => {
    console.log('Limpando clipboard');
    setCopiedMateria(null);
    sessionStorage.removeItem('copiedMateria');
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
