
export interface ModeloEspelho {
  id: string;
  nome: string;
  descricao?: string;
  estrutura: {
    blocos: Array<{
      nome: string;
      ordem: number;
      materias: Array<{
        retranca: string;
        clip?: string;
        tempo_clip?: string;
        duracao: number;
        texto?: string;
        cabeca?: string;
        gc?: string;
        status?: string;
        pagina?: string;
        reporter?: string;
        local_gravacao?: string;
        tags?: string[];
        equipamento?: string;
        ordem: number;
      }>;
    }>;
  };
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export interface ModeloEspelhoCreateInput {
  nome: string;
  descricao?: string;
  estrutura: ModeloEspelho['estrutura'];
  user_id?: string;
}
