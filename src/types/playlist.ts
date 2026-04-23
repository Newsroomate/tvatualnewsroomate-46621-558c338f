export type PlaylistItemStatus = 'espera' | 'pronto' | 'no_ar' | 'exibido' | 'erro';

export interface PlaylistItem {
  id: string;
  telejornal_id: string;
  materia_id: string | null;
  titulo: string;
  clip: string | null;
  tipo: string | null;
  duracao: number;
  ordem: number;
  status: PlaylistItemStatus;
  notas: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
