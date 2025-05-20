export interface Telejornal {
  id: string;
  created_at?: string;
  nome: string;
  horario?: string;
  espelho_aberto: boolean;
}

export interface Bloco {
  id: string;
  created_at?: string;
  nome: string;
  telejornal_id: string;
  ordem: number;
}

export interface Materia {
  id: string;
  created_at?: string;
  titulo: string;
  descricao?: string;
  bloco_id: string;
  ordem: number;
  tempo_estimado?: number;
  apresentador?: string;
  reporter?: string;
  link_vt?: string;
}

export interface Pauta {
  id: string;
  created_at?: string;
  titulo: string;
  descricao?: string;
}

export interface CloseRundownDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  telejornalNome?: string;
}
