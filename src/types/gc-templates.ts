export type GCTemplateCategoria =
  | 'tarja_nome'
  | 'tarja_local'
  | 'credito'
  | 'titulo'
  | 'geral';

export interface GCTemplateCampo {
  label: string;
  valor: string;
}

export interface GCTemplate {
  id: string;
  telejornal_id: string | null;
  nome: string;
  categoria: GCTemplateCategoria;
  campos: GCTemplateCampo[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const GC_TEMPLATE_CATEGORIES: { value: GCTemplateCategoria; label: string }[] = [
  { value: 'tarja_nome', label: 'Tarja Nome' },
  { value: 'tarja_local', label: 'Tarja Local' },
  { value: 'credito', label: 'Crédito' },
  { value: 'titulo', label: 'Título' },
  { value: 'geral', label: 'Geral' },
];
