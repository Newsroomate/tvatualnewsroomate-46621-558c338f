
export interface ClipboardItem {
  id: string;
  type: 'block' | 'materia';
  data: ClipboardBlockData | ClipboardMateriaData;
  sourceTelejornalId: string;
  sourceTelejornalName: string;
  timestamp: number;
}

export interface ClipboardBlockData {
  nome: string;
  items: ClipboardMateriaData[];
}

export interface ClipboardMateriaData {
  retranca: string;
  clip?: string;
  duracao: number;
  texto?: string;
  cabeca?: string;
  status?: string;
  reporter?: string;
  local_gravacao?: string;
  tags?: string[];
  equipamento?: string;
}
