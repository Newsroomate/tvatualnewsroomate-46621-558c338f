import { supabase } from '@/integrations/supabase/client';
import { pushVmixAlert } from '@/services/vmix-alerts';

export interface VmixTriggerLog {
  id: string;
  materia_id: string | null;
  materia_retranca: string | null;
  telejornal_id: string | null;
  action: string;
  link_type: string | null;
  target: string | null;
  success: boolean;
  message: string | null;
  error_detail: string | null;
  vmix_host: string | null;
  vmix_port: number | null;
  duration_ms: number | null;
  source: string;
  user_id: string | null;
  user_name: string | null;
  created_at: string;
}

export interface LogVmixTriggerInput {
  materiaId?: string | null;
  materiaRetranca?: string | null;
  telejornalId?: string | null;
  action?: string;
  linkType?: string | null;
  target?: string | null;
  success: boolean;
  message?: string | null;
  errorDetail?: string | null;
  vmixHost?: string | null;
  vmixPort?: number | null;
  durationMs?: number | null;
  source?: 'manual' | 'auto';
}

/**
 * Registra um disparo do vMix no histórico de monitoramento.
 * Nunca lança erro — o log não pode quebrar o fluxo de exibição.
 */
export const logVmixTrigger = async (input: LogVmixTriggerInput): Promise<void> => {
  if (!input.success) {
    pushVmixAlert({
      kind: 'trigger_failed',
      title: input.message || 'Falha ao acionar o vMix',
      detail: input.errorDetail,
      materiaRetranca: input.materiaRetranca,
      target: input.target,
      // Disparos manuais já mostram o aviso na hora do clique
      silent: (input.source ?? 'manual') === 'manual',
    });
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let userName: string | null = user.email ?? null;
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.full_name) userName = profile.full_name;

    await supabase.from('vmix_trigger_logs').insert({
      materia_id: input.materiaId ?? null,
      materia_retranca: input.materiaRetranca ?? null,
      telejornal_id: input.telejornalId ?? null,
      action: input.action ?? 'trigger_link',
      link_type: input.linkType ?? null,
      target: input.target ?? null,
      success: input.success,
      message: input.message ?? null,
      error_detail: input.errorDetail ?? null,
      vmix_host: input.vmixHost ?? null,
      vmix_port: input.vmixPort ?? null,
      duration_ms: input.durationMs ?? null,
      source: input.source ?? 'manual',
      user_id: user.id,
      user_name: userName,
    });
  } catch (error) {
    console.error('Não foi possível registrar o disparo do vMix:', error);
  }
};

export const fetchVmixTriggerLogs = async (
  telejornalId?: string | null,
  limit = 200
): Promise<VmixTriggerLog[]> => {
  let query = supabase
    .from('vmix_trigger_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (telejornalId) {
    query = query.eq('telejornal_id', telejornalId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as VmixTriggerLog[];
};
