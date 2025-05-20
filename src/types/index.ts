
export interface Telejornal {
  id: string;
  nome: string;
  horario: string;
  created_at?: string;
  updated_at?: string;
}

export interface Bloco {
  id: string;
  telejornal_id: string;
  nome: string;
  ordem: number;
  created_at?: string;
  updated_at?: string;
}

export interface Materia {
  id: string;
  bloco_id: string;
  pagina: string;
  retranca: string;
  clip: string;
  duracao: number;
  status: "draft" | "pending" | "published" | "urgent";
  reporter: string;
  texto?: string;
  cabeca?: string;
  tags?: string[];
  horario_exibicao?: string;
  equipamento?: string;
  local_gravacao?: string;
  ordem: number;
  created_at?: string;
  updated_at?: string;
}

export interface Pauta {
  id: string;
  titulo: string;
  descricao?: string;
  status: string;
  data_cobertura?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GeneralScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Required fields for Bloco creation (based on Supabase schema)
export interface BlocoCreateInput {
  telejornal_id: string;
  nome: string;
  ordem: number;
}

// Required fields for Materia creation (based on Supabase schema)
export interface MateriaCreateInput {
  bloco_id: string;
  retranca: string;
  ordem: number;
}

// Required fields for Pauta creation (based on Supabase schema)
export interface PautaCreateInput {
  titulo: string;
  descricao?: string;
  status?: string;
}

// Required fields for Telejornal creation (based on Supabase schema)
export interface TelejornalCreateInput {
  nome: string;
  horario?: string;
}
