
import { useState, useEffect } from 'react';
import { Materia } from '@/types';
import { toast } from '@/hooks/use-toast';

const CLIPBOARD_STORAGE_KEY = 'copiedMateria';
const CLIPBOARD_TIMESTAMP_KEY = 'copiedMateriaTimestamp';
const BLOCK_CLIPBOARD_STORAGE_KEY = 'copiedBlock';
const BLOCK_CLIPBOARD_TIMESTAMP_KEY = 'copiedBlockTimestamp';
const CLIPBOARD_EXPIRY_HOURS = 24; // Matéria/bloco copiado expira em 24 horas

interface CopiedBlock {
  id: string;
  nome: string;
  ordem: number;
  materias: Materia[];
  is_copied_block: true;
}

export const useClipboard = () => {
  const [copiedMateria, setCopiedMateria] = useState<Materia | null>(null);
  const [copiedBlock, setCopiedBlock] = useState<CopiedBlock | null>(null);

  // Verificar se há matéria copiada no sessionStorage ao inicializar
  useEffect(() => {
    const loadStoredData = () => {
      try {
        // Carregar matéria copiada
        const storedMateria = sessionStorage.getItem(CLIPBOARD_STORAGE_KEY);
        const storedMateriaTimestamp = sessionStorage.getItem(CLIPBOARD_TIMESTAMP_KEY);
        
        if (storedMateria && storedMateriaTimestamp) {
          const timestamp = parseInt(storedMateriaTimestamp);
          const now = Date.now();
          const expiryTime = CLIPBOARD_EXPIRY_HOURS * 60 * 60 * 1000;
          
          if (now - timestamp < expiryTime) {
            const parsedMateria = JSON.parse(storedMateria);
            setCopiedMateria(parsedMateria);
            console.log('Matéria copiada recuperada do sessionStorage:', {
              retranca: parsedMateria.retranca,
              tempoArmazenado: Math.round((now - timestamp) / (1000 * 60)) + ' minutos',
              totalCampos: Object.keys(parsedMateria).length
            });
          } else {
            sessionStorage.removeItem(CLIPBOARD_STORAGE_KEY);
            sessionStorage.removeItem(CLIPBOARD_TIMESTAMP_KEY);
          }
        }

        // Carregar bloco copiado
        const storedBlock = sessionStorage.getItem(BLOCK_CLIPBOARD_STORAGE_KEY);
        const storedBlockTimestamp = sessionStorage.getItem(BLOCK_CLIPBOARD_TIMESTAMP_KEY);
        
        if (storedBlock && storedBlockTimestamp) {
          const timestamp = parseInt(storedBlockTimestamp);
          const now = Date.now();
          const expiryTime = CLIPBOARD_EXPIRY_HOURS * 60 * 60 * 1000;
          
          if (now - timestamp < expiryTime) {
            const parsedBlock = JSON.parse(storedBlock);
            setCopiedBlock(parsedBlock);
            console.log('Bloco copiado recuperado do sessionStorage:', {
              nome: parsedBlock.nome,
              materias: parsedBlock.materias.length,
              tempoArmazenado: Math.round((now - timestamp) / (1000 * 60)) + ' minutos'
            });
          } else {
            sessionStorage.removeItem(BLOCK_CLIPBOARD_STORAGE_KEY);
            sessionStorage.removeItem(BLOCK_CLIPBOARD_TIMESTAMP_KEY);
          }
        }
      } catch (error) {
        console.error('Erro ao recuperar dados copiados do sessionStorage:', error);
        sessionStorage.removeItem(CLIPBOARD_STORAGE_KEY);
        sessionStorage.removeItem(CLIPBOARD_TIMESTAMP_KEY);
        sessionStorage.removeItem(BLOCK_CLIPBOARD_STORAGE_KEY);
        sessionStorage.removeItem(BLOCK_CLIPBOARD_TIMESTAMP_KEY);
      }
    };

    loadStoredData();
    const interval = setInterval(loadStoredData, 1000);
    return () => clearInterval(interval);
  }, []);

  const copyMateria = (materia: Materia) => {
    console.log('Copiando matéria para clipboard global com persistência aprimorada:', {
      id: materia.id,
      retranca: materia.retranca,
      totalCampos: Object.keys(materia).length,
      camposImportantes: {
        texto: !!materia.texto,
        duracao: materia.duracao,
        reporter: !!materia.reporter,
        clip: !!materia.clip,
        pagina: !!materia.pagina,
        cabeca: !!materia.cabeca,
        gc: !!materia.gc,
        status: !!materia.status,
        tipo_material: !!materia.tipo_material
      }
    });

    setCopiedMateria(materia);
    // Limpar bloco copiado quando copiar matéria
    setCopiedBlock(null);
    sessionStorage.removeItem(BLOCK_CLIPBOARD_STORAGE_KEY);
    sessionStorage.removeItem(BLOCK_CLIPBOARD_TIMESTAMP_KEY);
    
    try {
      const timestamp = Date.now();
      sessionStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(materia));
      sessionStorage.setItem(CLIPBOARD_TIMESTAMP_KEY, timestamp.toString());
    } catch (error) {
      console.error('Erro ao salvar matéria no sessionStorage:', error);
      toast({
        title: "Aviso sobre persistência",
        description: "A matéria foi copiada mas pode não persistir entre sessões",
        variant: "destructive"
      });
    }

    const camposPreenchidos = Object.values(materia).filter(valor => 
      valor !== null && valor !== undefined && valor !== ''
    ).length;

    toast({
      title: "Matéria copiada com sucesso",
      description: `"${materia.retranca}" foi copiada com ${camposPreenchidos} campos preservados. Use Ctrl+V para colar no espelho atual.`,
    });
  };

  const copyBlock = (block: any, materias: Materia[]) => {
    console.log('Copiando bloco completo para clipboard:', {
      id: block.id,
      nome: block.nome,
      totalMaterias: materias.length,
      materiasRetrancas: materias.map(m => m.retranca)
    });

    const copiedBlockData: CopiedBlock = {
      id: block.id,
      nome: block.nome,
      ordem: block.ordem,
      materias: materias,
      is_copied_block: true
    };

    setCopiedBlock(copiedBlockData);
    // Limpar matéria copiada quando copiar bloco
    setCopiedMateria(null);
    sessionStorage.removeItem(CLIPBOARD_STORAGE_KEY);
    sessionStorage.removeItem(CLIPBOARD_TIMESTAMP_KEY);
    
    try {
      const timestamp = Date.now();
      sessionStorage.setItem(BLOCK_CLIPBOARD_STORAGE_KEY, JSON.stringify(copiedBlockData));
      sessionStorage.setItem(BLOCK_CLIPBOARD_TIMESTAMP_KEY, timestamp.toString());
    } catch (error) {
      console.error('Erro ao salvar bloco no sessionStorage:', error);
      toast({
        title: "Aviso sobre persistência",
        description: "O bloco foi copiado mas pode não persistir entre sessões",
        variant: "destructive"
      });
    }

    const totalDuracao = materias.reduce((sum, m) => sum + (m.duracao || 0), 0);
    const minutos = Math.floor(totalDuracao / 60);
    const segundos = totalDuracao % 60;

    toast({
      title: "Bloco copiado com sucesso",
      description: `Bloco "${block.nome}" foi copiado com ${materias.length} matérias (${minutos}:${segundos.toString().padStart(2, '0')}). Use Ctrl+V para colar no espelho atual.`,
    });
  };

  const clearClipboard = () => {
    console.log('Limpando clipboard e storage');
    setCopiedMateria(null);
    setCopiedBlock(null);
    sessionStorage.removeItem(CLIPBOARD_STORAGE_KEY);
    sessionStorage.removeItem(CLIPBOARD_TIMESTAMP_KEY);
    sessionStorage.removeItem(BLOCK_CLIPBOARD_STORAGE_KEY);
    sessionStorage.removeItem(BLOCK_CLIPBOARD_TIMESTAMP_KEY);
  };

  const hasCopiedMateria = () => {
    return copiedMateria !== null;
  };

  const hasCopiedBlock = () => {
    return copiedBlock !== null;
  };

  const checkStoredMateria = () => {
    try {
      const storedMateria = sessionStorage.getItem(CLIPBOARD_STORAGE_KEY);
      const storedTimestamp = sessionStorage.getItem(CLIPBOARD_TIMESTAMP_KEY);
      
      if (storedMateria && storedTimestamp) {
        const timestamp = parseInt(storedTimestamp);
        const now = Date.now();
        const expiryTime = CLIPBOARD_EXPIRY_HOURS * 60 * 60 * 1000;
        
        return now - timestamp < expiryTime;
      }
      return false;
    } catch {
      return false;
    }
  };

  return {
    copiedMateria,
    copiedBlock,
    copyMateria,
    copyBlock,
    clearClipboard,
    hasCopiedMateria,
    hasCopiedBlock,
    checkStoredMateria
  };
};
