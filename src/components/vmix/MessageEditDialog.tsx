import { useState } from 'react';
import { ViewerMessage } from '@/types/vmix';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TarjaPreview } from './TarjaPreview';
import { Radio, Pencil } from 'lucide-react';

interface MessageEditDialogProps {
  message: ViewerMessage | null;
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: ViewerMessage, editedName?: string, editedText?: string) => void;
  isLoading?: boolean;
}

export const MessageEditDialog = ({ message, isOpen, onClose, onSend, isLoading }: MessageEditDialogProps) => {
  const [editedName, setEditedName] = useState('');
  const [editedText, setEditedText] = useState('');

  const handleOpen = () => {
    if (message) {
      setEditedName(message.sender_name || message.phone_number);
      setEditedText(message.message_text);
    }
  };

  const handleSend = () => {
    if (!message) return;
    onSend(message, editedName, editedText);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); else handleOpen(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Preview e Edição
          </DialogTitle>
        </DialogHeader>

        {message && (
          <div className="space-y-4">
            <TarjaPreview message={message} editedText={editedText} editedName={editedName} />

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-xs">Nome exibido</Label>
                <Input
                  id="edit-name"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-text" className="text-xs">Mensagem</Label>
                <Textarea
                  id="edit-text"
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="text-sm min-h-[60px] resize-none"
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button 
            size="sm" 
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handleSend}
            disabled={isLoading}
          >
            <Radio className="h-4 w-4 mr-1" />
            Enviar ao Ar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
