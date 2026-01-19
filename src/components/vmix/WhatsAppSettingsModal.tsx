import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Copy, Check, ExternalLink, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface WhatsAppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WEBHOOK_URL = 'https://rigluylhplrrlfkssrur.supabase.co/functions/v1/whatsapp-webhook';

export const WhatsAppSettingsModal = ({ isOpen, onClose }: WhatsAppSettingsModalProps) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copiado!",
        description: "URL copiada para a área de transferência"
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            Configuração do WhatsApp
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Webhook URL */}
          <div className="space-y-2">
            <Label>URL do Webhook</Label>
            <div className="flex gap-2">
              <Input
                value={WEBHOOK_URL}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(WEBHOOK_URL)}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use esta URL como Callback URL no Meta for Developers
            </p>
          </div>

          <Separator />

          {/* Instructions */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Info className="h-4 w-4" />
              Como Configurar
            </h4>

            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center shrink-0">1</Badge>
                <p>Acesse o <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Meta for Developers <ExternalLink className="h-3 w-3" /></a></p>
              </div>

              <div className="flex gap-3">
                <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center shrink-0">2</Badge>
                <p>Crie ou acesse seu aplicativo do WhatsApp Business</p>
              </div>

              <div className="flex gap-3">
                <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center shrink-0">3</Badge>
                <p>Vá em <strong>WhatsApp → Configuration → Webhook</strong></p>
              </div>

              <div className="flex gap-3">
                <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center shrink-0">4</Badge>
                <div>
                  <p>Configure:</p>
                  <ul className="list-disc list-inside mt-1 text-muted-foreground">
                    <li><strong>Callback URL:</strong> Cole a URL acima</li>
                    <li><strong>Verify Token:</strong> Use o token configurado nos secrets</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center shrink-0">5</Badge>
                <div>
                  <p>Assine os eventos:</p>
                  <ul className="list-disc list-inside mt-1 text-muted-foreground">
                    <li><code className="bg-muted px-1 rounded">messages</code></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Secrets reminder */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>Secrets necessários:</strong>
            </p>
            <ul className="text-xs text-amber-600 dark:text-amber-500 mt-1 space-y-0.5">
              <li>• WHATSAPP_ACCESS_TOKEN</li>
              <li>• WHATSAPP_PHONE_NUMBER_ID</li>
              <li>• WHATSAPP_VERIFY_TOKEN</li>
            </ul>
          </div>

          <Button onClick={onClose} className="w-full">
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
