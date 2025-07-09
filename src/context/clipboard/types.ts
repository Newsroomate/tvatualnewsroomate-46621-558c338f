import { Materia } from '@/types';

export interface CopiedBlock {
  id: string;
  nome: string;
  ordem: number;
  materias: Materia[];
  is_copied_block: true;
}

export interface ClipboardState {
  copiedMateria: Materia | null;
  copiedBlock: CopiedBlock | null;
  isOperationInProgress: boolean;
  lastOperation: number;
}

export interface ClipboardContextType extends ClipboardState {
  copyMateria: (materia: Materia) => Promise<void>;
  copyBlock: (block: any, materias: Materia[]) => Promise<void>;
  clearClipboard: () => void;
  hasCopiedMateria: () => boolean;
  hasCopiedBlock: () => boolean;
  checkStoredMateria: () => boolean;
  validateClipboard: () => boolean;
  notifyPasteSuccess: () => void;
}

export interface ClipboardProviderProps {
  children: React.ReactNode;
}