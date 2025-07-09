import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Materia } from '@/types';
import { toast } from '@/hooks/use-toast';
import { ClipboardState, CopiedBlock, ClipboardProviderProps, ClipboardContextType } from './types';
import { 
  DEBOUNCE_DELAY, 
  AUTO_CLEANUP_DELAY, 
  POST_PASTE_CLEANUP_DELAY,
  CLIPBOARD_STORAGE_KEY,
  CLIPBOARD_TIMESTAMP_KEY,
  BLOCK_CLIPBOARD_STORAGE_KEY,
  BLOCK_CLIPBOARD_TIMESTAMP_KEY
} from './constants';
import {
  performAtomicClear,
  performAtomicSetMateria,
  performAtomicSetBlock,
  validateClipboardData,
  loadStoredClipboardData,
  checkStoredMateriaExists
} from './utils';
import { ClipboardContext } from './useClipboard';

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

  // Atomic clear function - removes everything simultaneously
  const atomicClear = useCallback(() => {
    // Clear React state
    setState(prev => ({
      ...prev,
      copiedMateria: null,
      copiedBlock: null,
      isOperationInProgress: false
    }));

    // Clear storage and notify
    performAtomicClear();

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
  }, []);

  // Atomic set function for materia
  const atomicSetMateria = useCallback((materia: Materia) => {
    const timestamp = performAtomicSetMateria(materia);
    
    // Set React state
    setState(prev => ({
      ...prev,
      copiedMateria: materia,
      copiedBlock: null, // Clear block atomically
      lastOperation: timestamp
    }));
    
    // Setup auto-cleanup
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
    }
    cleanupTimeoutRef.current = setTimeout(() => {
      console.log('⏰ Auto-limpeza do clipboard por timeout');
      atomicClear();
    }, AUTO_CLEANUP_DELAY);
  }, [atomicClear]);

  // Atomic set function for block
  const atomicSetBlock = useCallback((blockData: CopiedBlock) => {
    const timestamp = performAtomicSetBlock(blockData);
    
    // Set React state
    setState(prev => ({
      ...prev,
      copiedBlock: blockData,
      copiedMateria: null, // Clear materia atomically
      lastOperation: timestamp
    }));
    
    // Setup auto-cleanup
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
    }
    cleanupTimeoutRef.current = setTimeout(() => {
      console.log('⏰ Auto-limpeza do clipboard por timeout');
      atomicClear();
    }, AUTO_CLEANUP_DELAY);
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
    const { copiedMateria, copiedBlock } = loadStoredClipboardData();
    setState(prev => ({ ...prev, copiedMateria, copiedBlock }));
  }, []);

  // Listen for storage events (cross-tab synchronization)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if ([CLIPBOARD_STORAGE_KEY, BLOCK_CLIPBOARD_STORAGE_KEY].includes(e.key || '')) {
        console.log('🔄 Mudança detectada no sessionStorage, sincronizando...');
        validateClipboardData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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
    checkStoredMateria: checkStoredMateriaExists,
    validateClipboard: validateClipboardData,
    notifyPasteSuccess
  };

  return (
    <ClipboardContext.Provider value={contextValue}>
      {children}
    </ClipboardContext.Provider>
  );
};