import { Materia } from '@/types';

export type ClipboardType = 'materia' | 'block' | null;

export interface CopiedBlock {
  id: string;
  nome: string;
  ordem: number;
  materias: Materia[];
  is_copied_block: true;
  source_telejornal?: string;
}

export interface ClipboardState {
  type: ClipboardType;
  copiedMateria: Materia | null;
  copiedBlock: CopiedBlock | null;
  timestamp: number;
}

export interface UseUnifiedClipboardProps {
  blocks?: any[];
  setBlocks?: (updater: (blocks: any[]) => any[]) => void;
  selectedMateria?: Materia | null;
  selectedJournal?: string | null;
  currentTelejornal?: any;
  refreshBlocks?: () => void;
  markOptimisticUpdate?: (materiaId: string) => void;
}

export interface PasteOperationResult {
  success: boolean;
  message: string;
  error?: string;
}