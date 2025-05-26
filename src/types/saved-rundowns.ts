
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
        duracao: number;
        pagina?: string;
        reporter?: string;
        status?: string;
        texto?: string;
        cabeca?: string;
        ordem: number;
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
        duracao: number;
        pagina?: string;
        reporter?: string;
        status?: string;
        texto?: string;
        cabeca?: string;
        ordem: number;
      }>;
    }>;
  };
}
