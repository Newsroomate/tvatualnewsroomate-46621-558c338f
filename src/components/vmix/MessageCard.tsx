import { useState } from 'react';
import { ViewerMessage } from '@/types/vmix';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Check, X, Radio, Square, User, Clock, Image, Video, FileAudio, File, Play } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface MessageCardProps {
  message: ViewerMessage;
  onApprove?: (message: ViewerMessage) => void;
  onReject?: (message: ViewerMessage) => void;
  onSendToAir?: (message: ViewerMessage) => void;
  onRemoveFromAir?: (message: ViewerMessage) => void;
  isLoading?: boolean;
}

export const MessageCard = ({
  message,
  onApprove,
  onReject,
  onSendToAir,
  onRemoveFromAir,
  isLoading = false
}: MessageCardProps) => {
  const [showMediaPreview, setShowMediaPreview] = useState(false);
  
  const isOnAir = message.status === 'on_air';
  const isPending = message.status === 'pending';
  const isApproved = message.status === 'approved';
  const isUsed = message.status === 'used';
  const isRejected = message.status === 'rejected';

  const isImageMessage = message.message_type === 'image' || message.message_type === 'sticker';
  const isVideoMessage = message.message_type === 'video';
  const isAudioMessage = message.message_type === 'audio';
  const isDocumentMessage = message.message_type === 'document';
  const hasMedia = !!message.media_url;

  const getStatusBadge = () => {
    switch (message.status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Aguardando</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">Aprovada</Badge>;
      case 'on_air':
        return <Badge className="bg-green-500 text-white animate-pulse">NO AR</Badge>;
      case 'used':
        return <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/30">Usada</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">Rejeitada</Badge>;
      default:
        return null;
    }
  };

  const getTypeBadge = () => {
    if (message.message_type === 'text') return null;
    
    const typeConfig: Record<string, { icon: any; label: string; className: string }> = {
      image: { icon: Image, label: 'Foto', className: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
      video: { icon: Video, label: 'Vídeo', className: 'bg-pink-500/10 text-pink-600 border-pink-500/30' },
      audio: { icon: FileAudio, label: 'Áudio', className: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
      sticker: { icon: Image, label: 'Sticker', className: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30' },
      document: { icon: File, label: 'Arquivo', className: 'bg-gray-500/10 text-gray-600 border-gray-500/30' },
    };

    const config = typeConfig[message.message_type || 'text'];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'HH:mm', { locale: ptBR });
  };

  const renderMediaPreview = () => {
    if (!hasMedia) return null;

    if (isImageMessage) {
      return (
        <div 
          className="mt-2 cursor-pointer group relative overflow-hidden rounded-lg"
          onClick={() => setShowMediaPreview(true)}
        >
          <img 
            src={message.media_url!} 
            alt="Mídia" 
            className="w-full max-h-48 object-cover rounded-lg transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium transition-opacity">
              Clique para ampliar
            </span>
          </div>
        </div>
      );
    }

    if (isVideoMessage) {
      return (
        <div 
          className="mt-2 cursor-pointer group relative overflow-hidden rounded-lg bg-black/5"
          onClick={() => setShowMediaPreview(true)}
        >
          <video 
            src={message.media_url!} 
            className="w-full max-h-48 object-cover rounded-lg"
            muted
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play className="h-6 w-6 text-gray-900 ml-1" />
            </div>
          </div>
        </div>
      );
    }

    if (isAudioMessage) {
      return (
        <div className="mt-2">
          <audio 
            src={message.media_url!} 
            controls 
            className="w-full h-10"
          />
        </div>
      );
    }

    if (isDocumentMessage) {
      return (
        <div className="mt-2">
          <a 
            href={message.media_url!} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
          >
            <File className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-primary underline">Abrir documento</span>
          </a>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <Card 
        className={cn(
          "p-4 transition-all duration-300",
          isOnAir && "ring-2 ring-green-500 shadow-lg shadow-green-500/20",
          isRejected && "opacity-50"
        )}
      >
        <div className="flex gap-3">
          {/* Avatar */}
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={message.profile_photo_url || undefined} alt={message.sender_name || ''} />
            <AvatarFallback className="bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <span className="font-semibold text-foreground truncate">
                  {message.sender_name || message.phone_number}
                </span>
                {getTypeBadge()}
                {getStatusBadge()}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                <Clock className="h-3 w-3" />
                {formatTime(message.received_at)}
              </div>
            </div>

            {/* Message text */}
            {message.message_text && !message.message_text.startsWith('[') && (
              <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
                {message.message_text}
              </p>
            )}

            {/* Media preview */}
            {renderMediaPreview()}

            {/* Phone number */}
            <p className="text-xs text-muted-foreground mt-1">
              {message.phone_number}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-3 pt-3 border-t">
          {isPending && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-green-600 border-green-500/30 hover:bg-green-500/10"
                onClick={() => onApprove?.(message)}
                disabled={isLoading}
              >
                <Check className="h-4 w-4 mr-1" />
                Aprovar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-red-600 border-red-500/30 hover:bg-red-500/10"
                onClick={() => onReject?.(message)}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-1" />
                Rejeitar
              </Button>
            </>
          )}

          {isApproved && (
            <>
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => onSendToAir?.(message)}
                disabled={isLoading}
              >
                <Radio className="h-4 w-4 mr-1" />
                Enviar ao Ar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 border-red-500/30 hover:bg-red-500/10"
                onClick={() => onReject?.(message)}
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}

          {isOnAir && (
            <Button
              size="sm"
              variant="destructive"
              className="flex-1"
              onClick={() => onRemoveFromAir?.(message)}
              disabled={isLoading}
            >
              <Square className="h-4 w-4 mr-1" />
              Remover do Ar
            </Button>
          )}

          {isUsed && (
            <p className="text-xs text-muted-foreground w-full text-center">
              Exibida às {formatTime(message.sent_to_vmix_at)}
            </p>
          )}
        </div>
      </Card>

      {/* Media Preview Dialog */}
      <Dialog open={showMediaPreview} onOpenChange={setShowMediaPreview}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {isImageMessage && message.media_url && (
            <img 
              src={message.media_url} 
              alt="Mídia" 
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          )}
          {isVideoMessage && message.media_url && (
            <video 
              src={message.media_url} 
              controls 
              autoPlay
              className="w-full h-auto max-h-[80vh]"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
