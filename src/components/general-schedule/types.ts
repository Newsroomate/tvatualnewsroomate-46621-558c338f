
export interface EditableMateria {
  id: string;
  retranca: string;
  clip?: string;
  duracao: number;
  texto?: string;
  cabeca?: string;
  gc?: string;
  status?: string;
  pagina?: string;
  reporter?: string;
  ordem: number;
  tags?: string[];
  local_gravacao?: string;
  bloco_id?: string;
  bloco_nome?: string;
  bloco_ordem?: number;
  tipo_material?: string;
  tempo_clip?: string;
}
