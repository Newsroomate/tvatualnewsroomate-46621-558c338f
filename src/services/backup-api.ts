import { supabase } from "@/integrations/supabase/client";

export interface EspelhoBackup {
  id: string;
  created_at: string;
  backup_type: 'manual' | 'automatic' | 'pre_restore';
  scope?: string;
  total_espelhos: number;
  total_materias: number;
  total_blocos: number;
  total_telejornais?: number;
  total_pautas?: number;
  data?: any;
  created_by: string | null;
  notes?: string;
}

export type RestoreMode = 'merge' | 'overwrite';
export type RestoreScope = 'all' | 'telejornais' | 'pautas' | 'espelhos';

export async function createManualBackup(): Promise<EspelhoBackup> {
  const { data, error } = await supabase.functions.invoke('backup-espelhos', {
    body: { type: 'manual' },
  });
  if (error) throw error;
  return data;
}

export async function listBackups(): Promise<EspelhoBackup[]> {
  const { data, error } = await supabase.functions.invoke('backup-espelhos', { method: 'GET' });
  if (error) throw error;
  return data || [];
}

export async function downloadBackup(backupId: string): Promise<any> {
  const { data, error } = await supabase.functions.invoke(`backup-espelhos/${backupId}`, { method: 'GET' });
  if (error) throw error;
  return data;
}

export async function restoreBackup(
  backupId: string,
  mode: RestoreMode = 'merge',
  scope: RestoreScope = 'all',
  telejornalIds: string[] = []
): Promise<{ success: boolean; restored: number; details: Record<string, number> }> {
  const { data, error } = await supabase.functions.invoke(`backup-espelhos/restore/${backupId}`, {
    body: { mode, scope, telejornalIds },
  });
  if (error) throw error;
  return data;
}

export async function deleteBackup(backupId: string): Promise<void> {
  const { error } = await supabase.functions.invoke(`backup-espelhos/${backupId}`, { method: 'DELETE' });
  if (error) throw error;
}
