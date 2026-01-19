import { supabase } from '@/integrations/supabase/client';
import { ViewerMessage, MessageStatus } from '@/types/vmix';

export const fetchViewerMessages = async (
  telejornalId?: string,
  status?: MessageStatus | MessageStatus[]
): Promise<ViewerMessage[]> => {
  let query = supabase
    .from('viewer_messages')
    .select('*')
    .order('received_at', { ascending: false });

  if (telejornalId) {
    query = query.eq('telejornal_id', telejornalId);
  }

  if (status) {
    if (Array.isArray(status)) {
      query = query.in('status', status);
    } else {
      query = query.eq('status', status);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching viewer messages:', error);
    throw error;
  }

  return data as ViewerMessage[];
};

export const approveMessage = async (
  messageId: string,
  userId: string
): Promise<ViewerMessage> => {
  const { data, error } = await supabase
    .from('viewer_messages')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: userId
    })
    .eq('id', messageId)
    .select()
    .single();

  if (error) {
    console.error('Error approving message:', error);
    throw error;
  }

  return data as ViewerMessage;
};

export const rejectMessage = async (messageId: string): Promise<ViewerMessage> => {
  const { data, error } = await supabase
    .from('viewer_messages')
    .update({ status: 'rejected' })
    .eq('id', messageId)
    .select()
    .single();

  if (error) {
    console.error('Error rejecting message:', error);
    throw error;
  }

  return data as ViewerMessage;
};

export const markAsOnAir = async (messageId: string): Promise<ViewerMessage> => {
  const { data, error } = await supabase
    .from('viewer_messages')
    .update({
      status: 'on_air',
      sent_to_vmix_at: new Date().toISOString()
    })
    .eq('id', messageId)
    .select()
    .single();

  if (error) {
    console.error('Error marking message as on air:', error);
    throw error;
  }

  return data as ViewerMessage;
};

export const markAsUsed = async (messageId: string): Promise<ViewerMessage> => {
  const { data, error } = await supabase
    .from('viewer_messages')
    .update({ status: 'used' })
    .eq('id', messageId)
    .select()
    .single();

  if (error) {
    console.error('Error marking message as used:', error);
    throw error;
  }

  return data as ViewerMessage;
};

export const deleteMessage = async (messageId: string): Promise<void> => {
  const { error } = await supabase
    .from('viewer_messages')
    .delete()
    .eq('id', messageId);

  if (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

export const assignMessageToTelejornal = async (
  messageId: string,
  telejornalId: string
): Promise<ViewerMessage> => {
  const { data, error } = await supabase
    .from('viewer_messages')
    .update({ telejornal_id: telejornalId })
    .eq('id', messageId)
    .select()
    .single();

  if (error) {
    console.error('Error assigning message to telejornal:', error);
    throw error;
  }

  return data as ViewerMessage;
};
