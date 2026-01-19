import { useState } from 'react';
import { ViewerMessagesPanel } from './ViewerMessagesPanel';
import { VmixSettingsModal } from './VmixSettingsModal';
import { WhatsAppSettingsModal } from './WhatsAppSettingsModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, MessageSquare, Radio } from 'lucide-react';
import { Telejornal } from '@/types';

interface VmixControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
  telejornais: Telejornal[];
  currentTelejornalId?: string;
}

export const VmixControlPanel = ({ 
  isOpen, 
  onClose, 
  telejornais,
  currentTelejornalId 
}: VmixControlPanelProps) => {
  const [selectedTelejornalId, setSelectedTelejornalId] = useState<string | undefined>(currentTelejornalId);
  const [showVmixSettings, setShowVmixSettings] = useState(false);
  const [showWhatsAppSettings, setShowWhatsAppSettings] = useState(false);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-green-600" />
                Mensagens ZAP / vMix
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowWhatsAppSettings(true)}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVmixSettings(true)}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">vMix</span>
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Telejornal Selector */}
          <div className="flex-shrink-0 pb-4">
            <Select
              value={selectedTelejornalId || 'all'}
              onValueChange={(value) => setSelectedTelejornalId(value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o telejornal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os telejornais</SelectItem>
                {telejornais.map(tj => (
                  <SelectItem key={tj.id} value={tj.id}>
                    {tj.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Messages Panel */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <ViewerMessagesPanel telejornalId={selectedTelejornalId} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Modals */}
      <VmixSettingsModal
        isOpen={showVmixSettings}
        onClose={() => setShowVmixSettings(false)}
        telejornalId={selectedTelejornalId}
      />

      <WhatsAppSettingsModal
        isOpen={showWhatsAppSettings}
        onClose={() => setShowWhatsAppSettings(false)}
      />
    </>
  );
};
