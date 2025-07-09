import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Materia } from '@/types';
import { toast } from '@/hooks/use-toast';

const CLIPBOARD_STORAGE_KEY = 'copiedMateria';
const CLIPBOARD_TIMESTAMP_KEY = 'copiedMateriaTimestamp';
const BLOCK_CLIPBOARD_STORAGE_KEY = 'copiedBlock';
const BLOCK_CLIPBOARD_TIMESTAMP_KEY = 'copiedBlockTimestamp';
const CLIPBOARD_EXPIRY_HOURS = 24;
const DEBOUNCE_DELAY = 300;
const AUTO_CLEANUP_DELAY = 30000; // 30 seconds
const POST_PASTE_CLEANUP_DELAY = 3000; // 3 seconds after paste

interface CopiedBlock {
  id: string;
  nome: string;
  ordem: number;
  materias: Materia[];
  is_copied_block: true;
}

interface ClipboardState {
  copiedMateria: Materia | null;
  copiedBlock: CopiedBlock | null;
  isOperationInProgress: boolean;
  lastOperation: number;
}

interface ClipboardContextType extends ClipboardState {
  copyMateria: (materia: Materia) => Promise<void>;
  copyBlock: (block: any, materias: Materia[]) => Promise<void>;
  clearClipboard: () => void;
  hasCopiedMateria: () => boolean;
  hasCopiedBlock: () => boolean;
  checkStoredMateria: () => boolean;
  validateClipboard: () => boolean;
  notifyPasteSuccess: () => void;
}

const ClipboardContext = createContext<ClipboardContextType | null>(null);

export const useClipboard = () => {
  const context = useContext(ClipboardContext);
  if (!context) {
    throw new Error('useClipboard must be used within a ClipboardProvider');
  }
  return context;
};

interface ClipboardProviderProps {
  children: React.ReactNode;
}

export const ClipboardProvider = ({ children }: ClipboardProviderProps) => {
  const [state, setState] = useState<ClipboardState>({
    copiedMateria: null,
    copiedBlock: null,
    isOperationInProgress: false,
    lastOperation: 0
  });

  const cleanupTimeoutRef = useRef<NodeJS.Timeout>();
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const postPasteCleanupRef = useRef<NodeJS.Timeout>();

  // Custom event for cross-component synchronization
  const dispatchClipboardEvent = useCallback((type: 'clear' | 'materia' | 'block', data?: any) => {
    const event = new CustomEvent('clipboardUpdate', {
      detail: { type, data, timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  }, []);

  // Atomic clear function - removes everything simultaneously
  const atomicClear = useCallback(() => {
    console.log('🧹 Limpeza atômica do clipboard');
    
    // Clear React state
    setState(prev => ({
      ...prev,
      copiedMateria: null,
      copiedBlock: null,
      isOperationInProgress: false
    }));

    // Clear all sessionStorage keys atomically
    try {
      sessionStorage.removeItem(CLIPBOARD_STORAGE_KEY);
      sessionStorage.removeItem(CLIPBOARD_TIMESTAMP_KEY);
      sessionStorage.removeItem(BLOCK_CLIPBOARD_STORAGE_KEY);
      sessionStorage.removeItem(BLOCK_CLIPBOARD_TIMESTAMP_KEY);
    } catch (error) {
      console.error('❌ Erro ao limpar sessionStorage:', error);
    }

    // Clear any pending timeouts
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (postPasteCleanupRef.current) {
      clearTimeout(postPasteCleanupRef.current);
    }

    // Notify all components
    dispatchClipboardEvent('clear');
  }, [dispatchClipboardEvent]);

  // Atomic set function for materia
  const atomicSetMateria = useCallback((materia: Materia) => {
    console.log('📄 Set atômico de matéria:', materia.retranca);
    
    const timestamp = Date.now();
    
    // Set React state
    setState(prev => ({
      ...prev,
      copiedMateria: materia,
      copiedBlock: null, // Clear block atomically
      lastOperation: timestamp
    }));

    try {
      // Set materia data
      sessionStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(materia));
      sessionStorage.setItem(CLIPBOARD_TIMESTAMP_KEY, timestamp.toString());
      
      // Clear block data atomically
      sessionStorage.removeItem(BLOCK_CLIPBOARD_STORAGE_KEY);
      sessionStorage.removeItem(BLOCK_CLIPBOARD_TIMESTAMP_KEY);
    } catch (error) {
      console.error('❌ Erro ao salvar matéria no sessionStorage:', error);
      throw error;
    }

    // Notify components
    dispatchClipboardEvent('materia', materia);
    
    // Setup auto-cleanup
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
    }
    cleanupTimeoutRef.current = setTimeout(() => {
      console.log('⏰ Auto-limpeza do clipboard por timeout');
      atomicClear();
    }, AUTO_CLEANUP_DELAY);
  }, [dispatchClipboardEvent, atomicClear]);

  // Atomic set function for block
  const atomicSetBlock = useCallback((blockData: CopiedBlock) => {
    console.log('📦 Set atômico de bloco:', blockData.nome);
    
    const timestamp = Date.now();
    
    // Set React state
    setState(prev => ({
      ...prev,
      copiedBlock: blockData,
      copiedMateria: null, // Clear materia atomically
      lastOperation: timestamp
    }));

    try {
      // Set block data
      sessionStorage.setItem(BLOCK_CLIPBOARD_STORAGE_KEY, JSON.stringify(blockData));
      sessionStorage.setItem(BLOCK_CLIPBOARD_TIMESTAMP_KEY, timestamp.toString());
      
      // Clear materia data atomically
      sessionStorage.removeItem(CLIPBOARD_STORAGE_KEY);
      sessionStorage.removeItem(CLIPBOARD_TIMESTAMP_KEY);
    } catch (error) {
      console.error('❌ Erro ao salvar bloco no sessionStorage:', error);
      throw error;
    }

    // Notify components
    dispatchClipboardEvent('block', blockData);
    
    // Setup auto-cleanup
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
    }
    cleanupTimeoutRef.current = setTimeout(() => {
      console.log('⏰ Auto-limpeza do clipboard por timeout');
      atomicClear();
    }, AUTO_CLEANUP_DELAY);
  }, [dispatchClipboardEvent, atomicClear]);

  // Validation function
  const validateClipboard = useCallback(() => {
    try {
      const now = Date.now();
      const expiryTime = CLIPBOARD_EXPIRY_HOURS * 60 * 60 * 1000;

      // Check materia validity
      const materiaTimestamp = sessionStorage.getItem(CLIPBOARD_TIMESTAMP_KEY);
      const materiaMeta = sessionStorage.getItem(CLIPBOARD_STORAGE_KEY);
      
      // Check block validity
      const blockTimestamp = sessionStorage.getItem(BLOCK_CLIPBOARD_TIMESTAMP_KEY);
      const blockMeta = sessionStorage.getItem(BLOCK_CLIPBOARD_STORAGE_KEY);

      let hasValidMateria = false;
      let hasValidBlock = false;

      if (materiaTimestamp && materiaMeta) {
        const timestamp = parseInt(materiaTimestamp);
        hasValidMateria = (now - timestamp < expiryTime);
      }

      if (blockTimestamp && blockMeta) {
        const timestamp = parseInt(blockTimestamp);
        hasValidBlock = (now - timestamp < expiryTime);
      }

      // If we have expired data, clean it up
      if (!hasValidMateria && !hasValidBlock && (materiaMeta || blockMeta)) {
        console.log('🗑️ Dados expirados detectados, limpando...');
        atomicClear();
        return false;
      }

      return hasValidMateria || hasValidBlock;
    } catch (error) {
      console.error('❌ Erro na validação do clipboard:', error);
      atomicClear();
      return false;
    }
  }, [atomicClear]);

  // Debounced copy function for materia
  const copyMateria = useCallback(async (materia: Materia) => {
    if (state.isOperationInProgress) {
      console.log('⚠️ Operação de cópia em andamento, ignorando...');
      return;
    }

    const now = Date.now();
    if (now - state.lastOperation < DEBOUNCE_DELAY) {
      console.log('⚠️ Operação muito rápida, aplicando debounce...');
      
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      debounceTimeoutRef.current = setTimeout(() => {
        copyMateria(materia);
      }, DEBOUNCE_DELAY);
      return;
    }

    setState(prev => ({ ...prev, isOperationInProgress: true }));
    
    try {
      atomicSetMateria(materia);

      const camposPreenchidos = Object.values(materia).filter(valor => 
        valor !== null && valor !== undefined && valor !== ''
      ).length;

      toast({
        title: "Matéria copiada",
        description: `"${materia.retranca}" copiada com ${camposPreenchidos} campos. Use Ctrl+V para colar.`,
      });
    } catch (error) {
      console.error('❌ Erro ao copiar matéria:', error);
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar a matéria",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => {
        setState(prev => ({ ...prev, isOperationInProgress: false }));
      }, 200);
    }
  }, [state.isOperationInProgress, state.lastOperation, atomicSetMateria]);

  // Debounced copy function for block
  const copyBlock = useCallback(async (block: any, materias: Materia[]) => {
    if (state.isOperationInProgress) {
      console.log('⚠️ Operação de cópia em andamento, ignorando...');
      return;
    }

    const now = Date.now();
    if (now - state.lastOperation < DEBOUNCE_DELAY) {
      console.log('⚠️ Operação muito rápida, aplicando debounce...');
      
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      debounceTimeoutRef.current = setTimeout(() => {
        copyBlock(block, materias);
      }, DEBOUNCE_DELAY);
      return;
    }

    setState(prev => ({ ...prev, isOperationInProgress: true }));
    
    try {
      const copiedBlockData: CopiedBlock = {
        id: block.id,
        nome: block.nome,
        ordem: block.ordem,
        materias: materias,
        is_copied_block: true
      };

      atomicSetBlock(copiedBlockData);

      const totalDuracao = materias.reduce((sum, m) => sum + (m.duracao || 0), 0);
      const minutos = Math.floor(totalDuracao / 60);
      const segundos = totalDuracao % 60;

      toast({
        title: "Bloco copiado",
        description: `"${block.nome}" copiado com ${materias.length} matérias (${minutos}:${segundos.toString().padStart(2, '0')}). Use Ctrl+V para colar.`,
      });
    } catch (error) {
      console.error('❌ Erro ao copiar bloco:', error);
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o bloco",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => {
        setState(prev => ({ ...prev, isOperationInProgress: false }));
      }, 200);
    }
  }, [state.isOperationInProgress, state.lastOperation, atomicSetBlock]);

  // Function to notify successful paste and trigger auto-cleanup
  const notifyPasteSuccess = useCallback(() => {
    console.log('🎯 Paste bem-sucedido, limpeza automática em 3 segundos');
    
    // Clear existing post-paste timer
    if (postPasteCleanupRef.current) {
      clearTimeout(postPasteCleanupRef.current);
    }
    
    // Set new cleanup timer
    postPasteCleanupRef.current = setTimeout(() => {
      console.log('🧹 Limpeza automática pós-paste');
      atomicClear();
    }, POST_PASTE_CLEANUP_DELAY);
  }, [atomicClear]);

  // Load stored data on initialization
  useEffect(() => {
    const loadStoredData = () => {
      try {
        const now = Date.now();
        const expiryTime = CLIPBOARD_EXPIRY_HOURS * 60 * 60 * 1000;

        // Load materia
        const storedMateria = sessionStorage.getItem(CLIPBOARD_STORAGE_KEY);
        const storedMateriaTimestamp = sessionStorage.getItem(CLIPBOARD_TIMESTAMP_KEY);
        
        if (storedMateria && storedMateriaTimestamp) {
          const timestamp = parseInt(storedMateriaTimestamp);
          if (now - timestamp < expiryTime) {
            const parsedMateria = JSON.parse(storedMateria);
            setState(prev => ({ ...prev, copiedMateria: parsedMateria }));
            console.log('📄 Matéria copiada recuperada:', parsedMateria.retranca);
          } else {
            sessionStorage.removeItem(CLIPBOARD_STORAGE_KEY);
            sessionStorage.removeItem(CLIPBOARD_TIMESTAMP_KEY);
          }
        }

        // Load block
        const storedBlock = sessionStorage.getItem(BLOCK_CLIPBOARD_STORAGE_KEY);
        const storedBlockTimestamp = sessionStorage.getItem(BLOCK_CLIPBOARD_TIMESTAMP_KEY);
        
        if (storedBlock && storedBlockTimestamp) {
          const timestamp = parseInt(storedBlockTimestamp);
          if (now - timestamp < expiryTime) {
            const parsedBlock = JSON.parse(storedBlock);
            setState(prev => ({ ...prev, copiedBlock: parsedBlock }));
            console.log('📦 Bloco copiado recuperado:', parsedBlock.nome);
          } else {
            sessionStorage.removeItem(BLOCK_CLIPBOARD_STORAGE_KEY);
            sessionStorage.removeItem(BLOCK_CLIPBOARD_TIMESTAMP_KEY);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao recuperar dados do clipboard:', error);
        atomicClear();
      }
    };

    loadStoredData();
  }, [atomicClear]);

  // Listen for storage events (cross-tab synchronization)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if ([CLIPBOARD_STORAGE_KEY, BLOCK_CLIPBOARD_STORAGE_KEY].includes(e.key || '')) {
        console.log('🔄 Mudança detectada no sessionStorage, sincronizando...');
        validateClipboard();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [validateClipboard]);

  // Listen for custom clipboard events
  useEffect(() => {
    const handleClipboardUpdate = (e: CustomEvent) => {
      console.log('🔄 Evento de clipboard recebido:', e.detail);
      // This ensures all components stay in sync
    };

    window.addEventListener('clipboardUpdate', handleClipboardUpdate as EventListener);
    return () => window.removeEventListener('clipboardUpdate', handleClipboardUpdate as EventListener);
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (postPasteCleanupRef.current) {
        clearTimeout(postPasteCleanupRef.current);
      }
    };
  }, []);

  const contextValue: ClipboardContextType = {
    ...state,
    copyMateria,
    copyBlock,
    clearClipboard: atomicClear,
    hasCopiedMateria: () => state.copiedMateria !== null,
    hasCopiedBlock: () => state.copiedBlock !== null,
    checkStoredMateria: () => {
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
    },
    validateClipboard,
    notifyPasteSuccess
  };

  return (
    <ClipboardContext.Provider value={contextValue}>
      {children}
    </ClipboardContext.Provider>
  );
};