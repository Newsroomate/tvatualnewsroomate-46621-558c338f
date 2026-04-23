import { supabase } from "@/integrations/supabase/client";
import { GCType } from "@/types/gc";

export interface GCSavedEntry {
  id: string;
  user_id: string;
  tipo: GCType;
  linha1: string;
  linha2: string;
  use_count: number;
  created_at: string;
  updated_at: string;
}

export const searchGCSavedEntries = async (query: string, limit = 8): Promise<GCSavedEntry[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const term = query.trim();
  let q = supabase
    .from('gc_saved_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('use_count', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (term.length >= 1) {
    q = q.ilike('linha1', `%${term}%`);
  }
  const { data, error } = await q;
  if (error) {
    console.error('searchGCSavedEntries error:', error);
    return [];
  }
  return (data || []) as GCSavedEntry[];
};

export const listGCSavedEntries = async (): Promise<GCSavedEntry[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('gc_saved_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []) as GCSavedEntry[];
};

export const upsertGCSavedEntry = async (
  tipo: GCType,
  linha1: string,
  linha2: string
): Promise<GCSavedEntry | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const linha1c = (linha1 || '').trim();
  const linha2c = (linha2 || '').trim();
  if (!linha1c) return null;

  // Check existing
  const { data: existing } = await supabase
    .from('gc_saved_entries')
    .select('*')
    .eq('user_id', user.id)
    .eq('tipo', tipo)
    .eq('linha1', linha1c)
    .eq('linha2', linha2c)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('gc_saved_entries')
      .update({ use_count: (existing.use_count || 0) + 1 })
      .eq('id', existing.id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as GCSavedEntry;
  }

  const { data, error } = await supabase
    .from('gc_saved_entries')
    .insert({ user_id: user.id, tipo, linha1: linha1c, linha2: linha2c })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as GCSavedEntry;
};

export const deleteGCSavedEntry = async (id: string): Promise<void> => {
  const { error } = await supabase.from('gc_saved_entries').delete().eq('id', id);
  if (error) throw error;
};

export const updateGCSavedEntry = async (
  id: string,
  updates: Partial<Pick<GCSavedEntry, 'tipo' | 'linha1' | 'linha2'>>
): Promise<void> => {
  const { error } = await supabase.from('gc_saved_entries').update(updates).eq('id', id);
  if (error) throw error;
};
