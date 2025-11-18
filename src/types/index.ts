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

export interface BlocoCreateInput {
  nome: string;
  telejornal_id: string;
  ordem: number;
}

export interface Materia {
  id: string;
  created_at?: string;
  updated_at?: string;
  // Update Materia interface to match the actual database schema
  bloco_id: string;
  pauta_id?: string;
  ordem: number;
  // Add fields used in the application
  retranca: string;  // This is required
  clip?: string;
  duracao: number;
  status?: string;
  pagina?: string;
  reporter?: string;
  editor?: string;
  equipamento?: string;  // Equipment field from database
  // Note: 'observacoes', 'lauda', and 'teleprompter' fields removed - don't exist in materias table (only in materias_snapshots)
  gc?: string;  // Database field for GC (graphics/text overlay)
  // Frontend form fields that map directly to database columns
  texto?: string;  // Maps to 'texto' column in database
  cabeca?: string; // Maps to 'cabeca' column in database
  tempo_clip?: string;  // New field for clip duration
  local_gravacao?: string;
  tags?: string[];
  horario_exibicao?: string;
  tipo_material?: string;  // New field for material type dropdown
  is_from_snapshot?: boolean;  // Add this field to support snapshot origin tracking
  // Keep the old fields for backwards compatibility
  titulo: string;
  descricao?: string;
  tempo_estimado?: number;
  apresentador?: string;
  link_vt?: string;
}

export interface MateriaCreateInput {
  bloco_id: string;
  pauta_id?: string;
  ordem: number;
  retranca: string;  // This is required
  clip?: string;
  duracao: number;
  pagina?: string;
  reporter?: string;
  editor?: string;
  equipamento?: string;  // Equipment field from database
  status?: string;
  // Note: 'observacoes', 'lauda', and 'teleprompter' fields removed - don't exist in materias table (only in materias_snapshots)
  gc?: string;  // Database field for GC (graphics/text overlay)
  texto?: string;  // Database field
  cabeca?: string;  // Database field
  tempo_clip?: string;
  local_gravacao?: string;
  tipo_material?: string;
  tags?: any;
}

export interface Pauta {
  id: string;
  created_at?: string;
  titulo: string;
  descricao?: string;
  local?: string;
  horario?: string;
  entrevistado?: string;
  produtor?: string;
  proposta?: string;
  programa?: string;
  reporter?: string;
  encaminhamento?: string;
  informacoes?: string;
  user_id?: string;
  data_cobertura?: string;
  status?: string;
}

export interface PautaCreateInput {
  titulo: string;
  descricao?: string;
  local?: string;
  horario?: string;
  entrevistado?: string;
  produtor?: string;
  proposta?: string;
  encaminhamento?: string;
  informacoes?: string;
  status?: string;
  data_cobertura?: string;
  programa?: string;
  reporter?: string;
  user_id?: string;
}

export interface CloseRundownDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  telejornalNome?: string;
}

export * from './saved-rundowns';

export interface MateriaSnapshot {
  id: string;
  materia_original_id?: string;
  snapshot_id?: string;
  retranca: string;
  bloco_nome?: string;
  bloco_ordem?: number;
  ordem: number;
  duracao: number;
  clip?: string;
  tempo_clip?: string;
  pagina?: string;
  reporter?: string;
  editor?: string;
  equipamento?: string;  // Equipment field from database
  status?: string;
  texto?: string;
  cabeca?: string;
  gc?: string;
  tipo_material?: string;
  local_gravacao?: string;
  tags?: string[];
  horario_exibicao?: string;
  is_snapshot: boolean;
  created_at?: string;
  updated_at?: string;
}
