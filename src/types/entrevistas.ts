export interface Entrevista {
  id: string;
  titulo: string;
  entrevistado: string;
  tema?: string;
  descricao?: string;
  reporter?: string;
  local?: string;
  data_entrevista?: string;
  duracao?: number;
  status: string;
  observacoes?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EntrevistaCreateInput {
  titulo: string;
  entrevistado: string;
  tema?: string;
  descricao?: string;
  reporter?: string;
  local?: string;
  data_entrevista?: string;
  duracao?: number;
  status?: string;
  observacoes?: string;
}

export interface EntrevistaTelejornal {
  id: string;
  entrevista_id: string;
  telejornal_id: string;
  created_at: string;
}
