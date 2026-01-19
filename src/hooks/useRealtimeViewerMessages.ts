import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ViewerMessage, MessageStatus } from '@/types/vmix';
import { fetchViewerMessages } from '@/services/viewer-messages-api';

interface UseRealtimeViewerMessagesProps {
  telejornalId?: string;
  status?: MessageStatus | MessageStatus[];
  enabled?: boolean;
}

export const useRealtimeViewerMessages = ({
  telejornalId,
  status,
  enabled = true
}: UseRealtimeViewerMessagesProps = {}) => {
  const [messages, setMessages] = useState<ViewerMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadMessages = useCallback(async () => {
    if (!enabled) return;
    
    try {
      setIsLoading(true);
      const data = await fetchViewerMessages(telejornalId, status);
      setMessages(data);
      setError(null);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [telejornalId, status, enabled]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel('viewer_messages_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'viewer_messages'
        },
        (payload) => {
          console.log('Realtime update:', payload);

          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as ViewerMessage;
            
            // Check if message matches our filters
            if (telejornalId && newMessage.telejornal_id !== telejornalId) {
              return;
            }
            
            if (status) {
              const statusArray = Array.isArray(status) ? status : [status];
              if (!statusArray.includes(newMessage.status as MessageStatus)) {
                return;
              }
            }

            setMessages(prev => [newMessage, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedMessage = payload.new as ViewerMessage;
            
            setMessages(prev => {
              // Check if message still matches our filters
              if (status) {
                const statusArray = Array.isArray(status) ? status : [status];
                if (!statusArray.includes(updatedMessage.status as MessageStatus)) {
                  // Remove from list if it no longer matches
                  return prev.filter(m => m.id !== updatedMessage.id);
                }
              }

              // Update the message in the list
              const exists = prev.some(m => m.id === updatedMessage.id);
              if (exists) {
                return prev.map(m => m.id === updatedMessage.id ? updatedMessage : m);
              } else {
                // Add if it now matches our filters
                return [updatedMessage, ...prev];
              }
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setMessages(prev => prev.filter(m => m.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [telejornalId, status, enabled]);

  const refresh = useCallback(() => {
    loadMessages();
  }, [loadMessages]);

  // Count by status
  const counts = {
    pending: messages.filter(m => m.status === 'pending').length,
    approved: messages.filter(m => m.status === 'approved').length,
    on_air: messages.filter(m => m.status === 'on_air').length,
    used: messages.filter(m => m.status === 'used').length,
    rejected: messages.filter(m => m.status === 'rejected').length
  };

  return {
    messages,
    isLoading,
    error,
    refresh,
    counts
  };
};
