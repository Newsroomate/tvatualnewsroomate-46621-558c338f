export type PlayoutStatusType = 'idle' | 'running' | 'paused';

export interface PlayoutStatus {
  id: string;
  telejornal_id: string;
  status: PlayoutStatusType;
  current_materia_id: string | null;
  started_at: string | null;
  current_item_started_at: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export type PlayoutTriggerType = 'vmix_command' | 'gpi_out' | 'custom';
export type PlayoutTriggerExecuteAt = 'on_take' | 'on_finish' | 'after_delay';

export interface PlayoutTrigger {
  id: string;
  materia_id: string;
  trigger_type: PlayoutTriggerType;
  trigger_data: Record<string, any>;
  execute_at: PlayoutTriggerExecuteAt;
  offset_ms: number;
  ordem: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
