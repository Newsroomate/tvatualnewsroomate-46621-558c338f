
export interface ModeloEspelho {
  id: string;
  nome: string;
  descricao?: string;
  telejornal_id?: string;
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
        ordem: number;
      }>;
    }>;
  };
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ModeloEspelhoCreateInput {
  nome: string;
  descricao?: string;
  telejornal_id?: string;
  estrutura: ModeloEspelho['estrutura'];
}
