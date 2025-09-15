
export interface SavedRundown {
  id: string;
  telejornal_id: string;
  data_salvamento: string;
  data_referencia: string;
  nome: string;
  estrutura: {
    blocos: Array<{
      id: string;
      nome: string;
      ordem: number;
      items: Array<{
        id: string;
        retranca: string;
        clip?: string;
        tempo_clip?: string;
        duracao: number;
        pagina?: string;
        reporter?: string;
        status?: string;
        texto?: string;
        cabeca?: string;
        gc?: string;
        tipo_material?: string;
        local_gravacao?: string;
        equipamento?: string;
        tags?: string[];
        horario_exibicao?: string;
        ordem: number;
        // Campos de compatibilidade
        titulo?: string;
        descricao?: string;
        tempo_estimado?: number;
        apresentador?: string;
        link_vt?: string;
      }>;
    }>;
  };
  created_at: string;
  updated_at: string;
}

export interface SavedRundownCreateInput {
  telejornal_id: string;
  data_referencia: string;
  nome: string;
  estrutura: {
    blocos: Array<{
      id: string;
      nome: string;
      ordem: number;
      items: Array<{
        id: string;
        retranca: string;
        clip?: string;
        tempo_clip?: string;
        duracao: number;
        pagina?: string;
        reporter?: string;
        status?: string;
        texto?: string;
        cabeca?: string;
        gc?: string;
        tipo_material?: string;
        local_gravacao?: string;
        equipamento?: string;
        tags?: string[];
        horario_exibicao?: string;
        ordem: number;
        // Campos de compatibilidade
        titulo?: string;
        descricao?: string;
        tempo_estimado?: number;
        apresentador?: string;
        link_vt?: string;
      }>;
    }>;
  };
}
