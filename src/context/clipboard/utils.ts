import { Materia } from '@/types';
import { CopiedBlock } from './types';
import {
  CLIPBOARD_STORAGE_KEY,
  CLIPBOARD_TIMESTAMP_KEY,
  BLOCK_CLIPBOARD_STORAGE_KEY,
  BLOCK_CLIPBOARD_TIMESTAMP_KEY,
  CLIPBOARD_EXPIRY_HOURS
} from './constants';

// Custom event for cross-component synchronization
export const dispatchClipboardEvent = (type: 'clear' | 'materia' | 'block', data?: any) => {
  const event = new CustomEvent('clipboardUpdate', {
    detail: { type, data, timestamp: Date.now() }
  });
  window.dispatchEvent(event);
};

// Atomic clear function - removes everything simultaneously
export const performAtomicClear = () => {
  console.log('🧹 Limpeza atômica do clipboard');
  
  // Clear all sessionStorage keys atomically
  try {
    sessionStorage.removeItem(CLIPBOARD_STORAGE_KEY);
    sessionStorage.removeItem(CLIPBOARD_TIMESTAMP_KEY);
    sessionStorage.removeItem(BLOCK_CLIPBOARD_STORAGE_KEY);
    sessionStorage.removeItem(BLOCK_CLIPBOARD_TIMESTAMP_KEY);
  } catch (error) {
    console.error('❌ Erro ao limpar sessionStorage:', error);
  }

  // Notify all components
  dispatchClipboardEvent('clear');
};

// Atomic set function for materia
export const performAtomicSetMateria = (materia: Materia) => {
  console.log('📄 Set atômico de matéria:', materia.retranca);
  
  const timestamp = Date.now();
  
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
  
  return timestamp;
};

// Atomic set function for block
export const performAtomicSetBlock = (blockData: CopiedBlock) => {
  console.log('📦 Set atômico de bloco:', blockData.nome);
  
  const timestamp = Date.now();
  
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
  
  return timestamp;
};

// Validation function
export const validateClipboardData = () => {
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
      performAtomicClear();
      return false;
    }

    return hasValidMateria || hasValidBlock;
  } catch (error) {
    console.error('❌ Erro na validação do clipboard:', error);
    performAtomicClear();
    return false;
  }
};

// Load stored data utility
export const loadStoredClipboardData = () => {
  try {
    const now = Date.now();
    const expiryTime = CLIPBOARD_EXPIRY_HOURS * 60 * 60 * 1000;
    
    let copiedMateria = null;
    let copiedBlock = null;

    // Load materia
    const storedMateria = sessionStorage.getItem(CLIPBOARD_STORAGE_KEY);
    const storedMateriaTimestamp = sessionStorage.getItem(CLIPBOARD_TIMESTAMP_KEY);
    
    if (storedMateria && storedMateriaTimestamp) {
      const timestamp = parseInt(storedMateriaTimestamp);
      if (now - timestamp < expiryTime) {
        copiedMateria = JSON.parse(storedMateria);
        console.log('📄 Matéria copiada recuperada:', copiedMateria.retranca);
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
        copiedBlock = JSON.parse(storedBlock);
        console.log('📦 Bloco copiado recuperado:', copiedBlock.nome);
      } else {
        sessionStorage.removeItem(BLOCK_CLIPBOARD_STORAGE_KEY);
        sessionStorage.removeItem(BLOCK_CLIPBOARD_TIMESTAMP_KEY);
      }
    }
    
    return { copiedMateria, copiedBlock };
  } catch (error) {
    console.error('❌ Erro ao recuperar dados do clipboard:', error);
    performAtomicClear();
    return { copiedMateria: null, copiedBlock: null };
  }
};

// Check stored materia utility
export const checkStoredMateriaExists = () => {
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