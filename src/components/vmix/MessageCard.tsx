import { ViewerMessage } from '@/types/vmix';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, X, Radio, Square, User, Clock } from 'lucide-react';
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
  const isOnAir = message.status === 'on_air';
  const isPending = message.status === 'pending';
  const isApproved = message.status === 'approved';
  const isUsed = message.status === 'used';
  const isRejected = message.status === 'rejected';

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

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'HH:mm', { locale: ptBR });
  };

  return (
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
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-foreground truncate">
                {message.sender_name || message.phone_number}
              </span>
              {getStatusBadge()}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
              <Clock className="h-3 w-3" />
              {formatTime(message.received_at)}
            </div>
          </div>

          <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
            {message.message_text}
          </p>

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
  );
};
