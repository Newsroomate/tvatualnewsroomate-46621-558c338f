import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, History } from 'lucide-react';
import { format } from 'date-fns';

export interface OperationEntry {
  id: string;
  action: 'approve' | 'reject' | 'send_to_air' | 'remove_from_air';
  messageSender: string;
  timestamp: Date;
}

interface OperationLogProps {
  entries: OperationEntry[];
}

const actionLabels: Record<OperationEntry['action'], { label: string; className: string }> = {
  approve: { label: 'Aprovada', className: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  reject: { label: 'Rejeitada', className: 'bg-red-500/10 text-red-600 border-red-500/30' },
  send_to_air: { label: 'No Ar', className: 'bg-green-500/10 text-green-600 border-green-500/30' },
  remove_from_air: { label: 'Removida', className: 'bg-gray-500/10 text-gray-600 border-gray-500/30' },
};

export const OperationLog = ({ entries }: OperationLogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (entries.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-between h-7 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <History className="h-3 w-3" />
            Histórico ({entries.length})
          </span>
          {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ScrollArea className="max-h-32 mt-1">
          <div className="space-y-1">
            {entries.slice(0, 50).map(entry => {
              const config = actionLabels[entry.action];
              return (
                <div key={entry.id} className="flex items-center justify-between text-xs px-2 py-1 rounded bg-muted/30">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Badge variant="outline" className={`text-[10px] h-4 px-1 ${config.className}`}>
                      {config.label}
                    </Badge>
                    <span className="truncate text-muted-foreground">{entry.messageSender}</span>
                  </div>
                  <span className="text-muted-foreground flex-shrink-0 ml-2">
                    {format(entry.timestamp, 'HH:mm:ss')}
                  </span>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  );
};
