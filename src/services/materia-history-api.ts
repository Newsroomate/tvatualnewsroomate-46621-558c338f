import { supabase } from "@/integrations/supabase/client";

export interface MateriaEditHistoryEntry {
  id: string;
  materia_id: string;
  user_id: string;
  action: string;
  created_at: string;
  user_name?: string;
}

export const fetchMateriaHistory = async (materiaId: string): Promise<MateriaEditHistoryEntry[]> => {
  // Fetch history entries
  const { data: history, error } = await supabase
    .from('materia_edit_history' as any)
    .select('*')
    .eq('materia_id', materiaId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  if (!history?.length) return [];

  // Get unique user IDs
  const userIds = [...new Set((history as any[]).map((h: any) => h.user_id))];
  
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds);

  const profileMap = new Map(profiles?.map(p => [p.id, p.full_name || 'Usuário']) || []);

  return (history as any[]).map((entry: any) => ({
    ...entry,
    user_name: profileMap.get(entry.user_id) || 'Usuário',
  }));
};
