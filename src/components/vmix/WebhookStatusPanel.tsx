import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Wifi, WifiOff, Clock, Send, MessageSquare, CheckCircle, AlertCircle, Loader2, FlaskConical, Copy, Check } from 'lucide-react';
import { testWebhookConnection, fetchLastMessage } from '@/services/viewer-messages-api';
import { useRealtimeViewerMessages } from '@/hooks/useRealtimeViewerMessages';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface WebhookStatusPanelProps {
  telejornalId?: string;
}

const WEBHOOK_URL = 'https://rigluylhplrrlfkssrur.supabase.co/functions/v1/whatsapp-webhook';

export const WebhookStatusPanel = ({ telejornalId }: WebhookStatusPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');
  const [webhookMessage, setWebhookMessage] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState(false);

  const { counts } = useRealtimeViewerMessages({ telejornalId });

  // Refresh relative time every 30s
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch last message on mount
  useEffect(() => {
    fetchLastMessage().then(msg => {
      if (msg?.received_at) setLastMessageTime(msg.received_at);
    });
  }, []);

  const handleTestWebhook = useCallback(async () => {
    setIsTesting(true);
    const result = await testWebhookConnection();
    setWebhookStatus(result.success ? 'online' : 'offline');
    setWebhookMessage(result.message);
    setIsTesting(false);
  }, []);

  const handleSendTestMessage = useCallback(async () => {
    setIsSendingTest(true);
    try {
      const response = await fetch(`${WEBHOOK_URL}?test=true`);
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('Mensagem de teste inserida com sucesso!');
        setLastMessageTime(new Date().toISOString());
        setWebhookStatus('online');
        setWebhookMessage('Endpoint funcional');
      } else {
        toast.error(`Falha: ${data.error || 'Erro desconhecido'}`);
        setWebhookStatus('offline');
      }
    } catch (err) {
      toast.error('Falha ao conectar ao endpoint');
      setWebhookStatus('offline');
    }
    setIsSendingTest(false);
  }, []);

  const handleCopyUrl = useCallback(() => {
    navigator.clipboard.writeText(WEBHOOK_URL);
    setCopied(true);
    toast.success('URL copiada!');
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const relativeTime = lastMessageTime
    ? formatDistanceToNow(new Date(lastMessageTime), { addSuffix: true, locale: ptBR })
    : null;

  const todayCount = counts.pending + counts.approved + counts.on_air + counts.used + counts.rejected;

  // Check if last message was within 5 minutes
  const lastMsgRecent = lastMessageTime
    ? (Date.now() - new Date(lastMessageTime).getTime()) < 5 * 60 * 1000
    : false;

  const statusColor = webhookStatus === 'online'
    ? 'bg-green-500'
    : webhookStatus === 'offline'
      ? 'bg-red-500'
      : 'bg-muted-foreground/50';

  const cardBorder = webhookStatus === 'online'
    ? 'border-green-500/30'
    : webhookStatus === 'offline'
      ? 'border-destructive/30'
      : 'border-border';

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={`${cardBorder} transition-colors`}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-3 text-left hover:bg-accent/50 rounded-t-lg transition-colors">
            <div className="flex items-center gap-2 text-sm font-medium">
              <div className={`h-2.5 w-2.5 rounded-full ${statusColor} ${webhookStatus === 'online' ? 'animate-pulse' : ''}`} />
              Status do Webhook
            </div>
            <div className="flex items-center gap-2">
              {lastMessageTime && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  Última msg: {relativeTime}
                </span>
              )}
              {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-3 px-3 space-y-3">
            {/* Status Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                {webhookStatus === 'online' ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : webhookStatus === 'offline' ? (
                  <WifiOff className="h-4 w-4 text-destructive" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-muted-foreground">
                  {webhookStatus === 'unknown' ? 'Não verificado' : webhookMessage}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestWebhook}
                disabled={isTesting}
                className="h-7 text-xs"
              >
                {isTesting ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Send className="h-3 w-3 mr-1" />
                )}
                Testar
              </Button>
            </div>

            {/* Counters */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs gap-1">
                <MessageSquare className="h-3 w-3" />
                {todayCount} total
              </Badge>
              <Badge variant="outline" className="text-xs gap-1 border-yellow-500/50 text-yellow-600">
                <Clock className="h-3 w-3" />
                {counts.pending} pendentes
              </Badge>
              <Badge variant="outline" className="text-xs gap-1 border-green-500/50 text-green-600">
                <CheckCircle className="h-3 w-3" />
                {counts.approved} aprovadas
              </Badge>
            </div>

            {/* Last message info */}
            {lastMessageTime && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Última mensagem recebida {relativeTime}
                {lastMsgRecent && (
                  <Badge variant="outline" className="text-xs ml-1 border-green-500/50 text-green-600">
                    recente
                  </Badge>
                )}
              </div>
            )}

            {/* Diagnostic Section */}
            <div className="border-t border-border pt-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Diagnóstico</p>
              
              {/* Callback URL with copy */}
              <div className="flex items-center gap-1">
                <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded flex-1 truncate">
                  {WEBHOOK_URL}
                </code>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleCopyUrl}>
                  {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>

              {/* Send test message button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendTestMessage}
                disabled={isSendingTest}
                className="w-full h-8 text-xs"
              >
                {isSendingTest ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <FlaskConical className="h-3 w-3 mr-1" />
                )}
                Enviar mensagem de teste ao banco
              </Button>

              {!lastMessageTime && webhookStatus === 'unknown' && (
                <p className="text-[10px] text-muted-foreground">
                  ⚠️ Nenhuma mensagem recebida. Verifique a configuração do webhook no Meta for Developers.
                </p>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
