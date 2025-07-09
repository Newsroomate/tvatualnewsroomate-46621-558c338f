
import { Materia } from '@/types';

export interface UsePasteMateriaProps {
  blocks: any[];
  setBlocks: (updater: (blocks: any[]) => any[]) => void;
  selectedMateria: Materia | null;
  copiedMateria: Materia | null;
  clearClipboard: () => void;
  markOptimisticUpdate?: (materiaId: string) => void;
  notifyPasteSuccess?: () => void;
}

export interface PasteMateriaData {
  bloco_id: string;
  ordem: number;
  retranca: string;
  texto: string;
  duracao: number;
  cabeca: string;
  gc: string;
  clip: string;
  tempo_clip: string;
  reporter: string;
  status: string;
  tipo_material: string;
  local_gravacao: string;
  equipamento: string;
  pagina: string;
}
