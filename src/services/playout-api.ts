import { supabase } from "@/integrations/supabase/client";
import { PlayoutStatus, PlayoutStatusType, PlayoutTrigger, PlayoutTriggerExecuteAt, PlayoutTriggerType } from "@/types/playout";

export const fetchPlayoutStatus = async (telejornalId: string): Promise<PlayoutStatus | null> => {
  const { data, error } = await supabase
    .from('playout_status')
    .select('*')
    .eq('telejornal_id', telejornalId)
    .maybeSingle();
  if (error) throw error;
  return data as PlayoutStatus | null;
};

export const upsertPlayoutStatus = async (
  telejornalId: string,
  updates: Partial<Omit<PlayoutStatus, 'id' | 'created_at' | 'updated_at' | 'telejornal_id'>>
): Promise<PlayoutStatus> => {
  const { data: { user } } = await supabase.auth.getUser();
  const existing = await fetchPlayoutStatus(telejornalId);
  if (existing) {
    const { data, error } = await supabase
      .from('playout_status')
      .update({ ...updates, updated_by: user?.id ?? null })
      .eq('id', existing.id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as PlayoutStatus;
  }
  const { data, error } = await supabase
    .from('playout_status')
    .insert({
      telejornal_id: telejornalId,
      status: (updates.status as PlayoutStatusType) || 'idle',
      current_materia_id: updates.current_materia_id ?? null,
      started_at: updates.started_at ?? null,
      current_item_started_at: updates.current_item_started_at ?? null,
      updated_by: user?.id ?? null,
    })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as PlayoutStatus;
};

export const subscribePlayoutStatus = (
  telejornalId: string,
  onChange: (status: PlayoutStatus | null) => void
) => {
  const channel = supabase
    .channel(`playout-status-${telejornalId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'playout_status', filter: `telejornal_id=eq.${telejornalId}` },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          onChange(null);
        } else {
          onChange(payload.new as PlayoutStatus);
        }
      }
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
};

// Triggers
export const fetchPlayoutTriggers = async (materiaId: string): Promise<PlayoutTrigger[]> => {
  const { data, error } = await supabase
    .from('playout_triggers')
    .select('*')
    .eq('materia_id', materiaId)
    .order('ordem', { ascending: true });
  if (error) throw error;
  return (data || []) as PlayoutTrigger[];
};

export const createPlayoutTrigger = async (input: {
  materia_id: string;
  trigger_type: PlayoutTriggerType;
  trigger_data: Record<string, any>;
  execute_at: PlayoutTriggerExecuteAt;
  offset_ms?: number;
  ordem?: number;
}): Promise<PlayoutTrigger> => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('playout_triggers')
    .insert({
      materia_id: input.materia_id,
      trigger_type: input.trigger_type,
      trigger_data: input.trigger_data as any,
      execute_at: input.execute_at,
      offset_ms: input.offset_ms ?? 0,
      ordem: input.ordem ?? 0,
      created_by: user?.id ?? null,
    })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as PlayoutTrigger;
};

export const updatePlayoutTrigger = async (id: string, updates: Partial<PlayoutTrigger>): Promise<void> => {
  const payload: any = { ...updates };
  if (payload.trigger_data) payload.trigger_data = payload.trigger_data as any;
  const { error } = await supabase.from('playout_triggers').update(payload).eq('id', id);
  if (error) throw error;
};

export const deletePlayoutTrigger = async (id: string): Promise<void> => {
  const { error } = await supabase.from('playout_triggers').delete().eq('id', id);
  if (error) throw error;
};
