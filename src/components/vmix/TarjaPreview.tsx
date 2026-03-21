import { ViewerMessage } from '@/types/vmix';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';

interface TarjaPreviewProps {
  message: ViewerMessage;
  editedText?: string;
  editedName?: string;
}

export const TarjaPreview = ({ message, editedText, editedName }: TarjaPreviewProps) => {
  const name = editedName ?? message.sender_name ?? message.phone_number;
  const text = editedText ?? message.message_text;

  return (
    <div className="rounded-lg overflow-hidden border border-border bg-black/90 p-0">
      <div className="text-[10px] text-muted-foreground px-3 pt-1.5 pb-0.5 uppercase tracking-wider">
        Preview da Tarja
      </div>
      <div className="flex items-center gap-3 px-3 py-2.5">
        <Avatar className="h-10 w-10 border-2 border-green-500 flex-shrink-0">
          <AvatarImage src={message.profile_photo_url || undefined} />
          <AvatarFallback className="bg-green-600 text-white">
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-white text-sm truncate">{name}</p>
          <p className="text-green-400 text-xs line-clamp-2">{text}</p>
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-green-500 via-green-400 to-green-600" />
    </div>
  );
};
