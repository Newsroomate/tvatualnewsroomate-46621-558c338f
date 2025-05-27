
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Bloco, Materia } from '@/types';

export type ClipboardItemType = 'block' | 'item';

export interface ClipboardData {
  type: ClipboardItemType;
  data: any;
  sourceTelejornalId: string;
  sourceTelejornalName: string;
  timestamp: number;
}

interface ClipboardContextType {
  clipboardData: ClipboardData | null;
  copyBlock: (block: Bloco & { items: Materia[] }, telejornalId: string, telejornalName: string) => void;
  copyItem: (item: Materia, telejornalId: string, telejornalName: string) => void;
  pasteBlock: (targetTelejornalId: string, targetOrder: number) => Promise<void>;
  pasteItem: (targetBlockId: string, targetOrder: number) => Promise<void>;
  clearClipboard: () => void;
  hasClipboardData: () => boolean;
  getClipboardType: () => ClipboardItemType | null;
}

const ClipboardContext = createContext<ClipboardContextType | undefined>(undefined);

export const useClipboard = () => {
  const context = useContext(ClipboardContext);
  if (context === undefined) {
    throw new Error('useClipboard must be used within a ClipboardProvider');
  }
  return context;
};

interface ClipboardProviderProps {
  children: ReactNode;
  onPasteBlock?: (data: any, targetTelejornalId: string, targetOrder: number) => Promise<void>;
  onPasteItem?: (data: any, targetBlockId: string, targetOrder: number) => Promise<void>;
}

export const ClipboardProvider = ({ children, onPasteBlock, onPasteItem }: ClipboardProviderProps) => {
  const [clipboardData, setClipboardData] = useState<ClipboardData | null>(null);

  const copyBlock = (block: Bloco & { items: Materia[] }, telejornalId: string, telejornalName: string) => {
    const cleanBlock = {
      ...block,
      id: undefined,
      created_at: undefined,
      updated_at: undefined,
      telejornal_id: undefined,
      items: block.items.map(item => ({
        ...item,
        id: undefined,
        created_at: undefined,
        updated_at: undefined,
        bloco_id: undefined
      }))
    };

    setClipboardData({
      type: 'block',
      data: cleanBlock,
      sourceTelejornalId: telejornalId,
      sourceTelejornalName: telejornalName,
      timestamp: Date.now()
    });
  };

  const copyItem = (item: Materia, telejornalId: string, telejornalName: string) => {
    const cleanItem = {
      ...item,
      id: undefined,
      created_at: undefined,
      updated_at: undefined,
      bloco_id: undefined
    };

    setClipboardData({
      type: 'item',
      data: cleanItem,
      sourceTelejornalId: telejornalId,
      sourceTelejornalName: telejornalName,
      timestamp: Date.now()
    });
  };

  const pasteBlock = async (targetTelejornalId: string, targetOrder: number) => {
    if (clipboardData?.type === 'block' && onPasteBlock) {
      await onPasteBlock(clipboardData.data, targetTelejornalId, targetOrder);
      setClipboardData(null);
    }
  };

  const pasteItem = async (targetBlockId: string, targetOrder: number) => {
    if (clipboardData?.type === 'item' && onPasteItem) {
      await onPasteItem(clipboardData.data, targetBlockId, targetOrder);
      setClipboardData(null);
    }
  };

  const clearClipboard = () => {
    setClipboardData(null);
  };

  const hasClipboardData = () => {
    return clipboardData !== null;
  };

  const getClipboardType = () => {
    return clipboardData?.type || null;
  };

  return (
    <ClipboardContext.Provider value={{
      clipboardData,
      copyBlock,
      copyItem,
      pasteBlock,
      pasteItem,
      clearClipboard,
      hasClipboardData,
      getClipboardType
    }}>
      {children}
    </ClipboardContext.Provider>
  );
};
