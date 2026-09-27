export type MessageStatus = 'pending' | 'approved' | 'on_air' | 'used' | 'rejected';

export interface ViewerMessage {
  id: string;
  phone_number: string;
  sender_name: string | null;
  message_text: string;
  message_type: string | null;
  profile_photo_url: string | null;
  media_url: string | null;
  status: MessageStatus | null;
  telejornal_id: string | null;
  received_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  sent_to_vmix_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface VmixSettings {
  id: string;
  telejornal_id: string | null;
  vmix_host: string;
  vmix_port: number;
  title_input_name: string;
  name_field: string;
  message_field: string;
  photo_field: string;
  overlay_number: number;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface VmixCommand {
  action: 'set_text' | 'set_image' | 'overlay_on' | 'overlay_off' | 'send_to_air' | 'remove_from_air' | 'test_connection' | 'get_state' | 'trigger_link';
  link_type?: 'input' | 'playlist' | 'preset';
  vmix_host?: string;
  vmix_port?: number;
  input_name?: string;
  field_name?: string;
  value?: string;
  overlay_number?: number;
  message_id?: string;
  message_data?: {
    sender_name: string;
    message_text: string;
    profile_photo_url?: string;
  };
  field_names?: {
    name: string;
    message: string;
    photo: string;
  };
}

export interface VmixResponse {
  success: boolean;
  message: string;
}

export type VmixLinkType = 'input' | 'playlist' | 'preset';

export interface VmixInputInfo {
  number: number;
  title: string;
  key?: string;
  type?: string;
}

export interface VmixStateResult {
  reachable: boolean;
  message: string;
  version?: string | null;
  edition?: string | null;
  active_title?: string | null;
  active_number?: number | null;
  preview_title?: string | null;
  preview_number?: number | null;
  inputs?: VmixInputInfo[];
  playlists?: string[];
  overlays?: number[];
  latency_ms?: number | null;
}

export interface VmixDiagnosticsResult {
  reachable: boolean;
  message: string;
  latency_ms?: number | null;
  version?: string | null;
  edition?: string | null;
  input_found: boolean;
  overlay_available: boolean;
  private_host: boolean;
}
