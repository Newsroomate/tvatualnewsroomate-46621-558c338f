
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
  const [isOperationInProgress, setIsOperationInProgress] = useState(false);

  // Load stored data only once on initialization
  useEffect(() => {
    const loadStoredData = () => {
      try {
        // Load copied materia
        const storedMateria = sessionStorage.getItem(CLIPBOARD_STORAGE_KEY);
        const storedMateriaTimestamp = sessionStorage.getItem(CLIPBOARD_TIMESTAMP_KEY);
        
        if (storedMateria && storedMateriaTimestamp) {
          const timestamp = parseInt(storedMateriaTimestamp);
          const now = Date.now();
          const expiryTime = CLIPBOARD_EXPIRY_HOURS * 60 * 60 * 1000;
          
          if (now - timestamp < expiryTime) {
            const parsedMateria = JSON.parse(storedMateria);
            setCopiedMateria(parsedMateria);
            console.log('Matéria copiada recuperada:', parsedMateria.retranca);
          } else {
            sessionStorage.removeItem(CLIPBOARD_STORAGE_KEY);
            sessionStorage.removeItem(CLIPBOARD_TIMESTAMP_KEY);
          }
        }

        // Load copied block
        const storedBlock = sessionStorage.getItem(BLOCK_CLIPBOARD_STORAGE_KEY);
        const storedBlockTimestamp = sessionStorage.getItem(BLOCK_CLIPBOARD_TIMESTAMP_KEY);
        
        if (storedBlock && storedBlockTimestamp) {
          const timestamp = parseInt(storedBlockTimestamp);
          const now = Date.now();
          const expiryTime = CLIPBOARD_EXPIRY_HOURS * 60 * 60 * 1000;
          
          if (now - timestamp < expiryTime) {
            const parsedBlock = JSON.parse(storedBlock);
            setCopiedBlock(parsedBlock);
            console.log('Bloco copiado recuperado:', parsedBlock.nome);
          } else {
            sessionStorage.removeItem(BLOCK_CLIPBOARD_STORAGE_KEY);
            sessionStorage.removeItem(BLOCK_CLIPBOARD_TIMESTAMP_KEY);
          }
        }
      } catch (error) {
        console.error('Erro ao recuperar dados do clipboard:', error);
        // Clean up corrupted data
        sessionStorage.removeItem(CLIPBOARD_STORAGE_KEY);
        sessionStorage.removeItem(CLIPBOARD_TIMESTAMP_KEY);
        sessionStorage.removeItem(BLOCK_CLIPBOARD_STORAGE_KEY);
        sessionStorage.removeItem(BLOCK_CLIPBOARD_TIMESTAMP_KEY);
      }
    };

    loadStoredData();
  }, []); // Only run once on mount

  // Debounced copy function to prevent rapid successive operations
  const copyMateria = async (materia: Materia) => {
    if (isOperationInProgress) {
      console.log('Operação de cópia em andamento, ignorando...');
      return;
    }

    setIsOperationInProgress(true);
    
    try {
      console.log('Copiando matéria:', materia.retranca);

      setCopiedMateria(materia);
      // Clear block when copying materia
      setCopiedBlock(null);
      sessionStorage.removeItem(BLOCK_CLIPBOARD_STORAGE_KEY);
      sessionStorage.removeItem(BLOCK_CLIPBOARD_TIMESTAMP_KEY);
      
      const timestamp = Date.now();
      sessionStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(materia));
      sessionStorage.setItem(CLIPBOARD_TIMESTAMP_KEY, timestamp.toString());

      const camposPreenchidos = Object.values(materia).filter(valor => 
        valor !== null && valor !== undefined && valor !== ''
      ).length;

      toast({
        title: "Matéria copiada",
        description: `"${materia.retranca}" copiada com ${camposPreenchidos} campos. Use Ctrl+V para colar.`,
      });
    } catch (error) {
      console.error('Erro ao copiar matéria:', error);
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar a matéria",
        variant: "destructive"
      });
    } finally {
      // Reset operation flag after a short delay
      setTimeout(() => setIsOperationInProgress(false), 200);
    }
  };

  const copyBlock = async (block: any, materias: Materia[]) => {
    if (isOperationInProgress) {
      console.log('Operação de cópia em andamento, ignorando...');
      return;
    }

    setIsOperationInProgress(true);
    
    try {
      console.log('Copiando bloco:', block.nome, 'com', materias.length, 'matérias');

      const copiedBlockData: CopiedBlock = {
        id: block.id,
        nome: block.nome,
        ordem: block.ordem,
        materias: materias,
        is_copied_block: true
      };

      setCopiedBlock(copiedBlockData);
      // Clear materia when copying block
      setCopiedMateria(null);
      sessionStorage.removeItem(CLIPBOARD_STORAGE_KEY);
      sessionStorage.removeItem(CLIPBOARD_TIMESTAMP_KEY);
      
      const timestamp = Date.now();
      sessionStorage.setItem(BLOCK_CLIPBOARD_STORAGE_KEY, JSON.stringify(copiedBlockData));
      sessionStorage.setItem(BLOCK_CLIPBOARD_TIMESTAMP_KEY, timestamp.toString());

      const totalDuracao = materias.reduce((sum, m) => sum + (m.duracao || 0), 0);
      const minutos = Math.floor(totalDuracao / 60);
      const segundos = totalDuracao % 60;

      toast({
        title: "Bloco copiado",
        description: `"${block.nome}" copiado com ${materias.length} matérias (${minutos}:${segundos.toString().padStart(2, '0')}). Use Ctrl+V para colar.`,
      });
    } catch (error) {
      console.error('Erro ao copiar bloco:', error);
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o bloco",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setIsOperationInProgress(false), 200);
    }
  };

  const clearClipboard = () => {
    console.log('Limpando clipboard');
    setCopiedMateria(null);
    setCopiedBlock(null);
    sessionStorage.removeItem(CLIPBOARD_STORAGE_KEY);
    sessionStorage.removeItem(CLIPBOARD_TIMESTAMP_KEY);
    sessionStorage.removeItem(BLOCK_CLIPBOARD_STORAGE_KEY);
    sessionStorage.removeItem(BLOCK_CLIPBOARD_TIMESTAMP_KEY);
    setIsOperationInProgress(false);
  };

  const hasCopiedMateria = () => copiedMateria !== null;
  const hasCopiedBlock = () => copiedBlock !== null;

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
    checkStoredMateria,
    isOperationInProgress
  };
};
