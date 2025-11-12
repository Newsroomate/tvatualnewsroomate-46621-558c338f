import { ClipboardState } from './types';

const UNIFIED_CLIPBOARD_KEY = 'unified_clipboard';
const CLIPBOARD_EXPIRY_HOURS = 24;

export const saveToStorage = (state: ClipboardState): void => {
  try {
    sessionStorage.setItem(UNIFIED_CLIPBOARD_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Erro ao salvar clipboard no storage:', error);
  }
};

export const loadFromStorage = (): ClipboardState | null => {
  try {
    const stored = sessionStorage.getItem(UNIFIED_CLIPBOARD_KEY);
    if (!stored) return null;

    const state: ClipboardState = JSON.parse(stored);
    
    // Verificar se não expirou
    const now = Date.now();
    const expiryTime = CLIPBOARD_EXPIRY_HOURS * 60 * 60 * 1000;
    
    if (now - state.timestamp > expiryTime) {
      clearStorage();
      return null;
    }

    return state;
  } catch (error) {
    console.error('Erro ao carregar clipboard do storage:', error);
    clearStorage();
    return null;
  }
};

export const clearStorage = (): void => {
  try {
    sessionStorage.removeItem(UNIFIED_CLIPBOARD_KEY);
  } catch (error) {
    console.error('Erro ao limpar storage:', error);
  }
};