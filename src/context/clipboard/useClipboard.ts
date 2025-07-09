import { createContext, useContext } from 'react';
import { ClipboardContextType } from './types';

export const ClipboardContext = createContext<ClipboardContextType | null>(null);

export const useClipboard = () => {
  const context = useContext(ClipboardContext);
  if (!context) {
    throw new Error('useClipboard must be used within a ClipboardProvider');
  }
  return context;
};