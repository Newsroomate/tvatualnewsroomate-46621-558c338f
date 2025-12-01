export interface Reportagem {
  id: string;
  titulo: string;
  descricao?: string;
  reporter?: string;
  editor?: string;
  local_gravacao?: string;
  data_gravacao?: string;
  duracao?: number;
  status: string;
  observacoes?: string;
  equipamento?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ReportagemCreateInput {
  titulo: string;
  descricao?: string;
  reporter?: string;
  editor?: string;
  local_gravacao?: string;
  data_gravacao?: string;
  duracao?: number;
  status?: string;
  observacoes?: string;
  equipamento?: string;
}

export interface ReportagemTelejornal {
  id: string;
  reportagem_id: string;
  telejornal_id: string;
  created_at: string;
}
