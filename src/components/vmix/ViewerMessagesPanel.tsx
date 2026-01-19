import { useState } from 'react';
import { useRealtimeViewerMessages } from '@/hooks/useRealtimeViewerMessages';
import { useVmixSettings } from '@/hooks/useVmixSettings';
import { useAuth } from '@/context/AuthContext';
import { ViewerMessage, MessageStatus } from '@/types/vmix';
import { MessageCard } from './MessageCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Inbox, CheckCircle, Radio, History, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { approveMessage, rejectMessage, markAsUsed } from '@/services/viewer-messages-api';
import { sendMessageToAir, removeFromAir } from '@/services/vmix-api';

interface ViewerMessagesPanelProps {
  telejornalId?: string;
}

export const ViewerMessagesPanel = ({ telejornalId }: ViewerMessagesPanelProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<MessageStatus>('pending');
  const [loadingMessageId, setLoadingMessageId] = useState<string | null>(null);

  const { messages, isLoading, refresh, counts } = useRealtimeViewerMessages({
    telejornalId,
    enabled: true
  });

  const { settings } = useVmixSettings({ telejornalId });

  const filteredMessages = messages.filter(m => m.status === activeTab);

  const handleApprove = async (message: ViewerMessage) => {
    if (!user?.id) return;

    try {
      setLoadingMessageId(message.id);
      await approveMessage(message.id, user.id);
      toast({
        title: "Mensagem aprovada",
        description: "A mensagem está pronta para ser enviada ao ar"
      });
    } catch (error) {
      toast({
        title: "Erro ao aprovar",
        description: "Não foi possível aprovar a mensagem",
        variant: "destructive"
      });
    } finally {
      setLoadingMessageId(null);
    }
  };

  const handleReject = async (message: ViewerMessage) => {
    try {
      setLoadingMessageId(message.id);
      await rejectMessage(message.id);
      toast({
        title: "Mensagem rejeitada"
      });
    } catch (error) {
      toast({
        title: "Erro ao rejeitar",
        description: "Não foi possível rejeitar a mensagem",
        variant: "destructive"
      });
    } finally {
      setLoadingMessageId(null);
    }
  };

  const handleSendToAir = async (message: ViewerMessage) => {
    if (!settings) {
      toast({
        title: "Configurações não encontradas",
        description: "Configure o vMix antes de enviar mensagens",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoadingMessageId(message.id);
      const result = await sendMessageToAir(message, settings);
      
      if (result.success) {
        toast({
          title: "Mensagem no ar!",
          description: result.message
        });
      } else {
        toast({
          title: "Erro ao enviar",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao enviar ao vMix",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoadingMessageId(null);
    }
  };

  const handleRemoveFromAir = async (message: ViewerMessage) => {
    if (!settings) return;

    try {
      setLoadingMessageId(message.id);
      const result = await removeFromAir(settings, message.id);
      
      if (result.success) {
        await markAsUsed(message.id);
        toast({
          title: "Removido do ar",
          description: result.message
        });
      } else {
        toast({
          title: "Erro ao remover",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoadingMessageId(null);
    }
  };

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
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Mensagens do WhatsApp</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MessageStatus)} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-5 mb-4">
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
                  onSendToAir={handleSendToAir}
                  onRemoveFromAir={handleRemoveFromAir}
                  isLoading={loadingMessageId === message.id}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
};
