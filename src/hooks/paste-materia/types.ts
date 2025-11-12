
import { Materia } from '@/types';

export interface UsePasteMateriaProps {
  blocks: any[];
  setBlocks: (updater: (blocks: any[]) => any[]) => void;
  selectedMateria: Materia | null;
  copiedMateria: Materia | null;
  clearClipboard: () => void;
  markOptimisticUpdate?: (materiaId: string) => void;
}

export interface PasteMateriaData {
  bloco_id: string;
  ordem: number;
  retranca: string;
  texto: string;
  duracao: number;
  cabeca: string;
  gc: string; // Using gc instead of lauda (database field)
  // Note: 'teleprompter' and 'observacoes' fields removed - don't exist in materias table (only in materias_snapshots)
  clip: string;
  tempo_clip: string;
  reporter: string;
  status: string;
  tipo_material: string;
  local_gravacao: string;
  tags: any;
  pagina: string;
}
