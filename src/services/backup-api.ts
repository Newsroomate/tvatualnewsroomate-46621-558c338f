import { supabase } from "@/integrations/supabase/client";

export interface EspelhoBackup {
  id: string;
  created_at: string;
  backup_type: 'manual' | 'automatic';
  total_espelhos: number;
  total_materias: number;
  total_blocos: number;
  data: any;
  created_by: string | null;
  notes?: string;
}

export async function createManualBackup(): Promise<EspelhoBackup> {
  const { data, error } = await supabase.functions.invoke('backup-espelhos', {
    body: { type: 'manual' },
  });

  if (error) throw error;
  return data;
}

export async function listBackups(): Promise<EspelhoBackup[]> {
  const { data, error } = await supabase.functions.invoke('backup-espelhos', {
    method: 'GET',
  });

  if (error) throw error;
  return data || [];
}

export async function downloadBackup(backupId: string): Promise<any> {
  const { data, error } = await supabase.functions.invoke(
    `backup-espelhos/${backupId}`,
    {
      method: 'GET',
    }
  );

  if (error) throw error;
  return data;
}

export async function restoreBackup(
  backupId: string,
  restoreType: 'complete' | 'partial' | 'merge' = 'complete',
  selectedIds?: string[]
): Promise<{ success: boolean; restored: number; type: string }> {
  const { data, error } = await supabase.functions.invoke(
    `backup-espelhos/restore/${backupId}`,
    {
      body: { restoreType, selectedIds },
    }
  );

  if (error) throw error;
  return data;
}

export async function deleteBackup(backupId: string): Promise<void> {
  const { error } = await supabase.functions.invoke(`backup-espelhos/${backupId}`, {
    method: 'DELETE',
  });

  if (error) throw error;
}
