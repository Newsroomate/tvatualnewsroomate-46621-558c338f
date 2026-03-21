import { useState, useEffect, useCallback, useRef } from 'react';
import { useRealtimeViewerMessages } from '@/hooks/useRealtimeViewerMessages';
import { useVmixSettings } from '@/hooks/useVmixSettings';
import { useAuth } from '@/context/AuthContext';
import { ViewerMessage, MessageStatus } from '@/types/vmix';
import { MessageCard } from './MessageCard';
import { MessageEditDialog } from './MessageEditDialog';
import { OperationLog, OperationEntry } from './OperationLog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RefreshCw, Inbox, CheckCircle, Radio, History, XCircle, Keyboard } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { approveMessage, rejectMessage, markAsUsed } from '@/services/viewer-messages-api';
import { sendMessageToAir, removeFromAir, updateVmixText } from '@/services/vmix-api';

interface ViewerMessagesPanelProps {
  telejornalId?: string;
}

export const ViewerMessagesPanel = ({ telejornalId }: ViewerMessagesPanelProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<MessageStatus>('pending');
  const [loadingMessageId, setLoadingMessageId] = useState<string | null>(null);
  const [autoQueue, setAutoQueue] = useState(false);
  const [editMessage, setEditMessage] = useState<ViewerMessage | null>(null);
  const [operationLog, setOperationLog] = useState<OperationEntry[]>([]);
  const autoQueueRef = useRef(autoQueue);
  autoQueueRef.current = autoQueue;

  const { messages, isLoading, refresh, counts } = useRealtimeViewerMessages({
    telejornalId,
    enabled: true
  });

  const { settings } = useVmixSettings({ telejornalId });

  const filteredMessages = messages.filter(m => m.status === activeTab);

  const addLog = useCallback((action: OperationEntry['action'], msg: ViewerMessage) => {
    setOperationLog(prev => [{
      id: `${Date.now()}-${msg.id}`,
      action,
      messageSender: msg.sender_name || msg.phone_number,
      timestamp: new Date()
    }, ...prev]);
  }, []);

  const handleApprove = useCallback(async (message: ViewerMessage) => {
    if (!user?.id) return;
    try {
      setLoadingMessageId(message.id);
      await approveMessage(message.id, user.id);
      addLog('approve', message);
      toast({ title: "Mensagem aprovada", description: "Pronta para enviar ao ar" });
    } catch {
      toast({ title: "Erro ao aprovar", variant: "destructive" });
    } finally {
      setLoadingMessageId(null);
    }
  }, [user?.id, addLog]);

  const handleReject = useCallback(async (message: ViewerMessage) => {
    try {
      setLoadingMessageId(message.id);
      await rejectMessage(message.id);
      addLog('reject', message);
      toast({ title: "Mensagem rejeitada" });
    } catch {
      toast({ title: "Erro ao rejeitar", variant: "destructive" });
    } finally {
      setLoadingMessageId(null);
    }
  }, [addLog]);

  const handleSendToAir = useCallback(async (message: ViewerMessage, editedName?: string, editedText?: string) => {
    if (!settings) {
      toast({ title: "Configure o vMix primeiro", variant: "destructive" });
      return;
    }
    try {
      setLoadingMessageId(message.id);
      
      // If text was edited, update vMix fields with edited values
      if (editedText && editedText !== message.message_text) {
        await updateVmixText(settings, settings.message_field, editedText);
      }
      if (editedName && editedName !== (message.sender_name || message.phone_number)) {
        await updateVmixText(settings, settings.name_field, editedName);
      }
      
      const result = await sendMessageToAir(message, settings);
      if (result.success) {
        addLog('send_to_air', message);
        toast({ title: "Mensagem no ar!", description: result.message });
      } else {
        toast({ title: "Erro ao enviar", description: result.message, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Erro ao enviar ao vMix", description: error.message, variant: "destructive" });
    } finally {
      setLoadingMessageId(null);
      setEditMessage(null);
    }
  }, [settings, addLog]);

  const handleRemoveFromAir = useCallback(async (message: ViewerMessage) => {
    if (!settings) return;
    try {
      setLoadingMessageId(message.id);
      const result = await removeFromAir(settings, message.id);
      if (result.success) {
        await markAsUsed(message.id);
        addLog('remove_from_air', message);
        toast({ title: "Removido do ar", description: result.message });
        
        // Auto-queue: send next approved message
        if (autoQueueRef.current) {
          const nextApproved = messages.find(m => m.status === 'approved' && m.id !== message.id);
          if (nextApproved) {
            setTimeout(() => handleSendToAir(nextApproved), 1500);
          }
        }
      } else {
        toast({ title: "Erro ao remover", description: result.message, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoadingMessageId(null);
    }
  }, [settings, messages, addLog, handleSendToAir]);

  const handlePreviewAndSend = useCallback((message: ViewerMessage) => {
    setEditMessage(message);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        if (activeTab === 'pending') {
          const next = filteredMessages[0];
          if (next) handleApprove(next);
        } else if (activeTab === 'approved') {
          const next = filteredMessages[0];
          if (next) handlePreviewAndSend(next);
        }
      }

      if (e.code === 'Escape') {
        const onAir = messages.find(m => m.status === 'on_air');
        if (onAir) handleRemoveFromAir(onAir);
      }

      if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey) {
        if (activeTab === 'pending') {
          const next = filteredMessages[0];
          if (next) handleReject(next);
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTab, filteredMessages, messages, handleApprove, handleReject, handleRemoveFromAir, handlePreviewAndSend]);

  const TabLabel = ({ status, icon: Icon, label }: { status: MessageStatus; icon: any; label: string }) => (
    <div className="flex items-center gap-1.5">
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
      {counts[status] > 0 && (
        <Badge 
          variant={status === 'on_air' ? 'default' : 'secondary'} 
          className={`h-5 min-w-5 px-1.5 text-xs ${status === 'on_air' ? 'bg-green-500' : ''}`}
        >
          {counts[status]}
        </Badge>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">Mensagens do WhatsApp</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Switch id="auto-queue" checked={autoQueue} onCheckedChange={setAutoQueue} className="scale-75" />
            <Label htmlFor="auto-queue" className="text-xs text-muted-foreground cursor-pointer">Auto</Label>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Keyboard hints */}
      <div className="flex items-center gap-2 mb-2 text-[10px] text-muted-foreground">
        <Keyboard className="h-3 w-3" />
        <span><kbd className="px-1 py-0.5 rounded bg-muted text-foreground">Espaço</kbd> Aprovar/Ar</span>
        <span><kbd className="px-1 py-0.5 rounded bg-muted text-foreground">R</kbd> Rejeitar</span>
        <span><kbd className="px-1 py-0.5 rounded bg-muted text-foreground">Esc</kbd> Remover</span>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MessageStatus)} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-5 mb-3">
          <TabsTrigger value="pending">
            <TabLabel status="pending" icon={Inbox} label="Aguardando" />
          </TabsTrigger>
          <TabsTrigger value="approved">
            <TabLabel status="approved" icon={CheckCircle} label="Aprovadas" />
          </TabsTrigger>
          <TabsTrigger value="on_air">
            <TabLabel status="on_air" icon={Radio} label="No Ar" />
          </TabsTrigger>
          <TabsTrigger value="used">
            <TabLabel status="used" icon={History} label="Usadas" />
          </TabsTrigger>
          <TabsTrigger value="rejected">
            <TabLabel status="rejected" icon={XCircle} label="Rejeitadas" />
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <div className="space-y-3 pr-4">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Inbox className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma mensagem {activeTab === 'pending' ? 'aguardando' : ''}</p>
              </div>
            ) : (
              filteredMessages.map(message => (
                <MessageCard
                  key={message.id}
                  message={message}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onSendToAir={handlePreviewAndSend}
                  onRemoveFromAir={handleRemoveFromAir}
                  isLoading={loadingMessageId === message.id}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </Tabs>

      {/* Operation Log */}
      <div className="mt-2 pt-2 border-t">
        <OperationLog entries={operationLog} />
      </div>

      {/* Preview/Edit Dialog */}
      <MessageEditDialog
        message={editMessage}
        isOpen={!!editMessage}
        onClose={() => setEditMessage(null)}
        onSend={handleSendToAir}
        isLoading={loadingMessageId === editMessage?.id}
      />
    </div>
  );
};
