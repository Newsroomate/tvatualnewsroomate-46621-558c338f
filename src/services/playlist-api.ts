import { supabase } from "@/integrations/supabase/client";
import { PlaylistItem, PlaylistItemStatus } from "@/types/playlist";
import { Bloco, Materia } from "@/types";

export const fetchPlaylistItems = async (telejornalId: string): Promise<PlaylistItem[]> => {
  const { data, error } = await supabase
    .from('playlist_items')
    .select('*')
    .eq('telejornal_id', telejornalId)
    .order('ordem', { ascending: true });
  if (error) throw error;
  return (data || []) as PlaylistItem[];
};

export const createPlaylistItem = async (
  item: Omit<PlaylistItem, 'id' | 'created_at' | 'updated_at' | 'created_by'>
): Promise<PlaylistItem> => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('playlist_items')
    .insert({ ...item, created_by: user?.id ?? null })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as PlaylistItem;
};

export const updatePlaylistItem = async (id: string, updates: Partial<PlaylistItem>): Promise<void> => {
  const { error } = await supabase.from('playlist_items').update(updates).eq('id', id);
  if (error) throw error;
};

export const deletePlaylistItem = async (id: string): Promise<void> => {
  const { error } = await supabase.from('playlist_items').delete().eq('id', id);
  if (error) throw error;
};

export const setPlaylistItemStatus = async (id: string, status: PlaylistItemStatus): Promise<void> => {
  const { error } = await supabase.from('playlist_items').update({ status }).eq('id', id);
  if (error) throw error;
};

const PLAYABLE_TIPOS = ['VT', 'NOTA COBERTA', 'LINK', 'NOTA_COBERTA', 'OFF'];

export const generatePlaylistFromBlocks = async (
  telejornalId: string,
  blocks: (Bloco & { items: Materia[] })[]
): Promise<PlaylistItem[]> => {
  // Wipe and regenerate
  await supabase.from('playlist_items').delete().eq('telejornal_id', telejornalId);

  const { data: { user } } = await supabase.auth.getUser();
  const rows: any[] = [];
  let ordem = 0;
  for (const block of blocks) {
    for (const m of block.items) {
      const tipo = (m.tipo_material || '').toUpperCase().trim();
      const isPlayable = !!m.clip || PLAYABLE_TIPOS.some((t) => tipo.includes(t));
      if (!isPlayable || !m.clip) continue;
      rows.push({
        telejornal_id: telejornalId,
        materia_id: m.id,
        titulo: m.retranca || 'Sem título',
        clip: m.clip,
        tipo: m.tipo_material || 'VT',
        duracao: m.duracao || 0,
        ordem: ordem++,
        status: 'espera' as PlaylistItemStatus,
        created_by: user?.id ?? null,
      });
    }
  }
  if (rows.length === 0) return [];
  const { data, error } = await supabase.from('playlist_items').insert(rows).select();
  if (error) throw error;
  return (data || []) as PlaylistItem[];
};

export const subscribePlaylist = (
  telejornalId: string,
  onChange: () => void
) => {
  const channel = supabase
    .channel(`playlist-${telejornalId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'playlist_items', filter: `telejornal_id=eq.${telejornalId}` },
      () => onChange()
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
};
