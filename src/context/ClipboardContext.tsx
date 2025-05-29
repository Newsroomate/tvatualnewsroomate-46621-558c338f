
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ClipboardBlock {
  id: string;
  nome: string;
  ordem: number;
  materias: Array<{
    id: string;
    retranca: string;
    clip?: string;
    duracao: number;
    texto?: string;
    cabeca?: string;
    gc?: string;
    status?: string;
    pagina?: string;
    reporter?: string;
    ordem: number;
    tags?: string[];
    local_gravacao?: string;
    equipamento?: string;
  }>;
  source_telejornal?: string;
  copied_at: string;
}

interface ClipboardContextType {
  copiedBlock: ClipboardBlock | null;
  copyBlock: (block: ClipboardBlock) => void;
  clearClipboard: () => void;
  hasClipboardData: () => boolean;
}

const ClipboardContext = createContext<ClipboardContextType | undefined>(undefined);

export const ClipboardProvider = ({ children }: { children: ReactNode }) => {
  const [copiedBlock, setCopiedBlock] = useState<ClipboardBlock | null>(null);

  const copyBlock = (block: ClipboardBlock) => {
    setCopiedBlock(block);
    console.log('Block copied to clipboard:', block);
  };

  const clearClipboard = () => {
    setCopiedBlock(null);
    console.log('Clipboard cleared');
  };

  const hasClipboardData = () => {
    return copiedBlock !== null;
  };

  return (
    <ClipboardContext.Provider value={{
      copiedBlock,
      copyBlock,
      clearClipboard,
      hasClipboardData
    }}>
      {children}
    </ClipboardContext.Provider>
  );
};

export const useClipboard = () => {
  const context = useContext(ClipboardContext);
  if (context === undefined) {
    throw new Error('useClipboard must be used within a ClipboardProvider');
  }
  return context;
};
