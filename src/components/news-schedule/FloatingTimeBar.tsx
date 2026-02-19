import { Clock, Timer } from "lucide-react";
import { formatTime } from "./utils";
import { Bloco, Materia } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BlockWithItems = Bloco & {
  items: Materia[];
  totalTime: number;
};

interface FloatingTimeBarProps {
  blocks: BlockWithItems[];
  totalJournalTime: number;
}

const getTimeColorClass = (seconds: number): string => {
  if (seconds === 0) return "bg-muted text-muted-foreground";
  if (seconds > 600) return "bg-destructive/15 text-destructive border-destructive/30";
  if (seconds > 300) return "bg-yellow-100 text-yellow-800 border-yellow-300";
  return "bg-green-100 text-green-800 border-green-300";
};

const getTotalTimeColorClass = (seconds: number): string => {
  if (seconds === 0) return "text-muted-foreground";
  if (seconds > 3600) return "text-destructive";
  if (seconds > 1800) return "text-yellow-600";
  return "text-green-600";
};

export const FloatingTimeBar = ({ blocks, totalJournalTime }: FloatingTimeBarProps) => {
  if (blocks.length === 0) return null;

  const totalMaterias = blocks.reduce((sum, b) => sum + b.items.length, 0);

  return (
    <div className="sticky bottom-0 z-20 bg-background/95 backdrop-blur-sm border-t border-border shadow-[0_-4px_12px_rgba(0,0,0,0.08)] px-4 py-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Per-block times */}
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          <Timer className="h-4 w-4 text-muted-foreground shrink-0" />
          {blocks.map((block) => (
            <Badge
              key={block.id}
              variant="outline"
              className={cn(
                "text-xs font-medium border transition-colors",
                getTimeColorClass(block.totalTime)
              )}
            >
              {block.nome}: {formatTime(block.totalTime)}
            </Badge>
          ))}
        </div>

        {/* Overall total */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-muted-foreground">
            {blocks.length} blocos • {totalMaterias} matérias
          </span>
          <div className="flex items-center gap-1.5">
            <Clock className={cn("h-4 w-4", getTotalTimeColorClass(totalJournalTime))} />
            <span className={cn("text-lg font-bold tabular-nums", getTotalTimeColorClass(totalJournalTime))}>
              {formatTime(totalJournalTime)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
