import { supabase } from '@/integrations/supabase/client';
import { VmixCommand, VmixResponse, VmixSettings, ViewerMessage } from '@/types/vmix';

const VMIX_FUNCTION_URL = 'https://rigluylhplrrlfkssrur.supabase.co/functions/v1/vmix-control';

async function callVmixFunction(command: VmixCommand): Promise<VmixResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Usuário não autenticado');
  }

  const response = await fetch(VMIX_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify(command)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao comunicar com vMix');
  }

  return response.json();
}

export const testVmixConnection = async (
  host: string = '192.168.0.2',
  port: number = 8088
): Promise<VmixResponse> => {
  return callVmixFunction({
    action: 'test_connection',
    vmix_host: host,
    vmix_port: port
  });
};

export const sendMessageToAir = async (
  message: ViewerMessage,
  settings: VmixSettings
): Promise<VmixResponse> => {
  return callVmixFunction({
    action: 'send_to_air',
    vmix_host: settings.vmix_host,
    vmix_port: settings.vmix_port,
    input_name: settings.title_input_name,
    overlay_number: settings.overlay_number,
    message_id: message.id,
    message_data: {
      sender_name: message.sender_name || message.phone_number,
      message_text: message.message_text,
      profile_photo_url: message.profile_photo_url || undefined
    },
    field_names: {
      name: settings.name_field,
      message: settings.message_field,
      photo: settings.photo_field
    }
  });
};

export const removeFromAir = async (
  settings: VmixSettings,
  messageId?: string
): Promise<VmixResponse> => {
  return callVmixFunction({
    action: 'remove_from_air',
    vmix_host: settings.vmix_host,
    vmix_port: settings.vmix_port,
    overlay_number: settings.overlay_number,
    message_id: messageId
  });
};

export const updateVmixText = async (
  settings: VmixSettings,
  fieldName: string,
  value: string
): Promise<VmixResponse> => {
  return callVmixFunction({
    action: 'set_text',
    vmix_host: settings.vmix_host,
    vmix_port: settings.vmix_port,
    input_name: settings.title_input_name,
    field_name: fieldName,
    value
  });
};

export const updateVmixImage = async (
  settings: VmixSettings,
  fieldName: string,
  imageUrl: string
): Promise<VmixResponse> => {
  return callVmixFunction({
    action: 'set_image',
    vmix_host: settings.vmix_host,
    vmix_port: settings.vmix_port,
    input_name: settings.title_input_name,
    field_name: fieldName,
    value: imageUrl
  });
};

// VmixSettings CRUD
export const fetchVmixSettings = async (telejornalId: string): Promise<VmixSettings | null> => {
  const { data, error } = await supabase
    .from('vmix_settings')
    .select('*')
    .eq('telejornal_id', telejornalId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching vmix settings:', error);
    throw error;
  }

  return data as VmixSettings | null;
};

export const createVmixSettings = async (
  telejornalId: string,
  settings: Partial<VmixSettings>
): Promise<VmixSettings> => {
  const { data, error } = await supabase
    .from('vmix_settings')
    .insert({
      telejornal_id: telejornalId,
      vmix_host: settings.vmix_host || '192.168.0.2',
      vmix_port: settings.vmix_port || 8088,
      title_input_name: settings.title_input_name || 'TarjaZAP',
      name_field: settings.name_field || 'Nome',
      message_field: settings.message_field || 'Mensagem',
      photo_field: settings.photo_field || 'Foto',
      overlay_number: settings.overlay_number || 1,
      is_active: settings.is_active ?? true
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating vmix settings:', error);
    throw error;
  }

  return data as VmixSettings;
};

export const updateVmixSettings = async (
  settingsId: string,
  updates: Partial<VmixSettings>
): Promise<VmixSettings> => {
  const { data, error } = await supabase
    .from('vmix_settings')
    .update(updates)
    .eq('id', settingsId)
    .select()
    .single();

  if (error) {
    console.error('Error updating vmix settings:', error);
    throw error;
  }

  return data as VmixSettings;
};
