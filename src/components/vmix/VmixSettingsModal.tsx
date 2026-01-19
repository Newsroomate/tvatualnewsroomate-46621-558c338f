import { useState, useEffect } from 'react';
import { useVmixSettings } from '@/hooks/useVmixSettings';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, Wifi, WifiOff, Loader2, Save, TestTube } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface VmixSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  telejornalId?: string;
}

export const VmixSettingsModal = ({ isOpen, onClose, telejornalId }: VmixSettingsModalProps) => {
  const { 
    settings, 
    isLoading, 
    isSaving, 
    isTesting,
    connectionStatus,
    saveSettings, 
    testConnection 
  } = useVmixSettings({ telejornalId });

  const [formData, setFormData] = useState({
    vmix_host: '192.168.0.2',
    vmix_port: 8088,
    title_input_name: 'TarjaZAP',
    name_field: 'Nome',
    message_field: 'Mensagem',
    photo_field: 'Foto',
    overlay_number: 1
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        vmix_host: settings.vmix_host,
        vmix_port: settings.vmix_port,
        title_input_name: settings.title_input_name,
        name_field: settings.name_field,
        message_field: settings.message_field,
        photo_field: settings.photo_field,
        overlay_number: settings.overlay_number
      });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await saveSettings(formData);
      toast({
        title: "Configurações salvas",
        description: "As configurações do vMix foram atualizadas"
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações",
        variant: "destructive"
      });
    }
  };

  const handleTest = async () => {
    try {
      const result = await testConnection();
      toast({
        title: result.success ? "Conexão OK" : "Falha na conexão",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
    } catch (error: any) {
      toast({
        title: "Erro ao testar",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getConnectionBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
            <Wifi className="h-3 w-3 mr-1" />
            Conectado
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-500/30">
            <WifiOff className="h-3 w-3 mr-1" />
            Desconectado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Não testado
          </Badge>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações do vMix
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Connection Status */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Status da Conexão</span>
              {getConnectionBadge()}
            </div>

            {/* Host and Port */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="vmix_host">IP do vMix</Label>
                <Input
                  id="vmix_host"
                  value={formData.vmix_host}
                  onChange={(e) => setFormData(prev => ({ ...prev, vmix_host: e.target.value }))}
                  placeholder="192.168.0.2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vmix_port">Porta</Label>
                <Input
                  id="vmix_port"
                  type="number"
                  value={formData.vmix_port}
                  onChange={(e) => setFormData(prev => ({ ...prev, vmix_port: parseInt(e.target.value) || 8088 }))}
                />
              </div>
            </div>

            <Separator />

            {/* Input Settings */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Configuração da Tarja</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="title_input_name">Nome do Input</Label>
                  <Input
                    id="title_input_name"
                    value={formData.title_input_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, title_input_name: e.target.value }))}
                    placeholder="TarjaZAP"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="overlay_number">Overlay (1-4)</Label>
                  <Input
                    id="overlay_number"
                    type="number"
                    min={1}
                    max={4}
                    value={formData.overlay_number}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      overlay_number: Math.min(4, Math.max(1, parseInt(e.target.value) || 1)) 
                    }))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Field Names */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Nomes dos Campos no vMix</h4>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="name_field">Campo Nome</Label>
                  <Input
                    id="name_field"
                    value={formData.name_field}
                    onChange={(e) => setFormData(prev => ({ ...prev, name_field: e.target.value }))}
                    placeholder="Nome"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message_field">Campo Mensagem</Label>
                  <Input
                    id="message_field"
                    value={formData.message_field}
                    onChange={(e) => setFormData(prev => ({ ...prev, message_field: e.target.value }))}
                    placeholder="Mensagem"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photo_field">Campo Foto</Label>
                  <Input
                    id="photo_field"
                    value={formData.photo_field}
                    onChange={(e) => setFormData(prev => ({ ...prev, photo_field: e.target.value }))}
                    placeholder="Foto"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleTest}
                disabled={isTesting}
              >
                {isTesting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4 mr-2" />
                )}
                Testar Conexão
              </Button>
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
