
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ClipboardItem } from '@/types/clipboard';

interface ClipboardContextType {
  clipboardItem: ClipboardItem | null;
  setClipboardItem: (item: ClipboardItem | null) => void;
  clearClipboard: () => void;
  hasClipboardData: boolean;
}

const ClipboardContext = createContext<ClipboardContextType | undefined>(undefined);

export const useClipboard = () => {
  const context = useContext(ClipboardContext);
  if (!context) {
    throw new Error('useClipboard must be used within a ClipboardProvider');
  }
  return context;
};

interface ClipboardProviderProps {
  children: ReactNode;
}

export const ClipboardProvider = ({ children }: ClipboardProviderProps) => {
  const [clipboardItem, setClipboardItem] = useState<ClipboardItem | null>(null);

  const clearClipboard = () => {
    setClipboardItem(null);
  };

  const hasClipboardData = clipboardItem !== null;

  return (
    <ClipboardContext.Provider
      value={{
        clipboardItem,
        setClipboardItem,
        clearClipboard,
        hasClipboardData
      }}
    >
      {children}
    </ClipboardContext.Provider>
  );
};
