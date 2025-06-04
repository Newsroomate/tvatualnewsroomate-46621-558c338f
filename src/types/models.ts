
export interface EspelhoModelo {
  id: string;
  created_at: string;
  updated_at: string;
  nome: string;
  telejornal_id: string | null;
  estrutura: {
    blocos: Array<{
      id: string;
      nome: string;
      ordem: number;
      materias: Array<{
        id: string;
        retranca: string;
        duracao: number;
        ordem: number;
        clip?: string;
        tempo_clip?: string;
        pagina?: string;
        reporter?: string;
        status?: string;
        texto?: string;
        cabeca?: string;
        gc?: string;
      }>;
    }>;
  };
  user_id: string;
}

export interface EspelhoModeloCreateInput {
  nome: string;
  telejornal_id: string | null;
  estrutura: EspelhoModelo['estrutura'];
  user_id: string;
}
