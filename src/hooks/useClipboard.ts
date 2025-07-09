
import { useState, useEffect, useCallback } from 'react';
import { Materia } from '@/types';
import { toast } from '@/hooks/use-toast';

const CLIPBOARD_STORAGE_KEY = 'clipboard_data';
const CLIPBOARD_EXPIRY_HOURS = 24;

interface ClipboardData {
  type: 'materia' | 'block';
  timestamp: number;
  data: Materia | CopiedBlock;
}

interface CopiedBlock {
  id: string;
  nome: string;
  ordem: number;
  materias: Materia[];
  is_copied_block: true;
}

export const useClipboard = () => {
  const [clipboardData, setClipboardData] = useState<ClipboardData | null>(null);
  const [isOperationInProgress, setIsOperationInProgress] = useState(false);

  // Derived state for backward compatibility
  const copiedMateria = clipboardData?.type === 'materia' ? clipboardData.data as Materia : null;
  const copiedBlock = clipboardData?.type === 'block' ? clipboardData.data as CopiedBlock : null;

  // Load and sync clipboard data from sessionStorage
  const loadClipboardData = useCallback(() => {
    try {
      const stored = sessionStorage.getItem(CLIPBOARD_STORAGE_KEY);
      if (!stored) {
        setClipboardData(null);
        return;
      }

      const parsedData: ClipboardData = JSON.parse(stored);
      
      // Check if data is expired
      const now = Date.now();
      const expiryTime = CLIPBOARD_EXPIRY_HOURS * 60 * 60 * 1000;
      
      if (now - parsedData.timestamp > expiryTime) {
        console.log('Clipboard data expired, clearing...');
        sessionStorage.removeItem(CLIPBOARD_STORAGE_KEY);
        setClipboardData(null);
        return;
      }

      // Validate data integrity
      if (!parsedData.type || !parsedData.data || !parsedData.timestamp) {
        console.warn('Invalid clipboard data structure, clearing...');
        sessionStorage.removeItem(CLIPBOARD_STORAGE_KEY);
        setClipboardData(null);
        return;
      }

      setClipboardData(parsedData);
      console.log('Clipboard data loaded:', {
        type: parsedData.type,
        timestamp: new Date(parsedData.timestamp).toISOString(),
        dataPreview: parsedData.type === 'materia' 
          ? (parsedData.data as Materia).retranca
          : (parsedData.data as CopiedBlock).nome
      });

    } catch (error) {
      console.error('Error loading clipboard data:', error);
      sessionStorage.removeItem(CLIPBOARD_STORAGE_KEY);
      setClipboardData(null);
    }
  }, []);

  // Save clipboard data to sessionStorage
  const saveClipboardData = useCallback((data: ClipboardData) => {
    try {
      sessionStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(data));
      setClipboardData(data);
      console.log('Clipboard data saved:', {
        type: data.type,
        timestamp: new Date(data.timestamp).toISOString()
      });
    } catch (error) {
      console.error('Error saving clipboard data:', error);
      toast({
        title: "Erro no clipboard",
        description: "Não foi possível salvar os dados copiados",
        variant: "destructive"
      });
    }
  }, []);

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CLIPBOARD_STORAGE_KEY) {
        console.log('Clipboard data changed in another tab, reloading...');
        loadClipboardData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadClipboardData]);

  // Load clipboard data on mount
  useEffect(() => {
    loadClipboardData();
  }, [loadClipboardData]);

  const copyMateria = async (materia: Materia) => {
    if (isOperationInProgress) {
      console.log('Copy operation already in progress, ignoring...');
      return;
    }

    setIsOperationInProgress(true);
    
    try {
      console.log('Copying materia:', materia.retranca);

      const clipboardData: ClipboardData = {
        type: 'materia',
        timestamp: Date.now(),
        data: materia
      };

      saveClipboardData(clipboardData);

      const camposPreenchidos = Object.values(materia).filter(valor => 
        valor !== null && valor !== undefined && valor !== ''
      ).length;

      toast({
        title: "Matéria copiada",
        description: `"${materia.retranca}" copiada com ${camposPreenchidos} campos. Use Ctrl+V para colar.`,
      });

    } catch (error) {
      console.error('Error copying materia:', error);
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar a matéria",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setIsOperationInProgress(false), 100);
    }
  };

  const copyBlock = async (block: any, materias: Materia[]) => {
    if (isOperationInProgress) {
      console.log('Copy operation already in progress, ignoring...');
      return;
    }

    setIsOperationInProgress(true);
    
    try {
      console.log('Copying block:', block.nome, 'with', materias.length, 'materias');

      const copiedBlockData: CopiedBlock = {
        id: block.id,
        nome: block.nome,
        ordem: block.ordem,
        materias: materias,
        is_copied_block: true
      };

      const clipboardData: ClipboardData = {
        type: 'block',
        timestamp: Date.now(),
        data: copiedBlockData
      };

      saveClipboardData(clipboardData);

      const totalDuracao = materias.reduce((sum, m) => sum + (m.duracao || 0), 0);
      const minutos = Math.floor(totalDuracao / 60);
      const segundos = totalDuracao % 60;

      toast({
        title: "Bloco copiado",
        description: `"${block.nome}" copiado com ${materias.length} matérias (${minutos}:${segundos.toString().padStart(2, '0')}). Use Ctrl+V para colar.`,
      });

    } catch (error) {
      console.error('Error copying block:', error);
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o bloco",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setIsOperationInProgress(false), 100);
    }
  };

  const clearClipboard = useCallback(() => {
    console.log('Clearing clipboard');
    sessionStorage.removeItem(CLIPBOARD_STORAGE_KEY);
    setClipboardData(null);
    setIsOperationInProgress(false);
  }, []);

  const hasCopiedMateria = () => clipboardData?.type === 'materia';
  const hasCopiedBlock = () => clipboardData?.type === 'block';

  const checkStoredMateria = () => {
    return clipboardData?.type === 'materia' && clipboardData.data !== null;
  };

  const getClipboardInfo = () => {
    if (!clipboardData) return null;
    
    return {
      type: clipboardData.type,
      timestamp: clipboardData.timestamp,
      age: Date.now() - clipboardData.timestamp,
      data: clipboardData.type === 'materia' 
        ? (clipboardData.data as Materia).retranca
        : (clipboardData.data as CopiedBlock).nome
    };
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
    isOperationInProgress,
    getClipboardInfo
  };
};
