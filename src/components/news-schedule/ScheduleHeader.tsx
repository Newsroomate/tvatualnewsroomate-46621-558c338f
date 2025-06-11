
import { Telejornal } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCcw, 
  AlignJustify, 
  FileText, 
  Save, 
  Copy,
  JapaneseYen 
} from "lucide-react";

interface ScheduleHeaderProps {
  currentTelejornal: Telejornal | null;
  totalJournalTime: number;
  onRenumberItems: () => void;
  hasBlocks: boolean;
  onAddBlock: () => void;
  onViewTeleprompter: () => void;
  onSaveModel: () => void;
  onViewSavedModels: () => void;
  blocks: any[];
  hasCopiedMateria?: boolean;
}

export const ScheduleHeader = ({
  currentTelejornal,
  totalJournalTime,
  onRenumberItems,
  hasBlocks,
  onAddBlock,
  onViewTeleprompter,
  onSaveModel,
  onViewSavedModels,
  blocks,
  hasCopiedMateria = false
}: ScheduleHeaderProps) => {
  // Format the time as hh:mm:ss
  const formatTime = (timeInSeconds: number) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <header className="p-4 border-b flex items-center justify-between sticky top-0 bg-background z-10">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">
            {currentTelejornal?.nome || "Telejornal"}
          </h2>
          {currentTelejornal?.horario && (
            <Badge variant="outline" className="text-xs">
              {currentTelejornal.horario}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Total: {formatTime(totalJournalTime)}</span>
          {blocks.length > 0 && (
            <>
              <span>•</span>
              <span>{blocks.length} blocos</span>
            </>
          )}
          {hasCopiedMateria && (
            <>
              <span>•</span>
              <Badge className="bg-blue-100 text-blue-800 border-blue-300 flex items-center gap-1">
                <Copy className="h-3 w-3" />
                Matéria na área de transferência
              </Badge>
            </>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSaveModel}
          disabled={blocks.length === 0}
        >
          <Save className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:inline">Salvar Modelo</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onViewSavedModels}
        >
          <JapaneseYen className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:inline">Usar Modelo</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onRenumberItems}
          disabled={!hasBlocks}
        >
          <AlignJustify className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:inline">Renumerar</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onViewTeleprompter}
          disabled={blocks.length === 0}
        >
          <FileText className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:inline">Teleprompter</span>
        </Button>
        
        <Button
          variant="default"
          size="sm"
          onClick={onAddBlock}
        >
          <span>Novo Bloco</span>
        </Button>
      </div>
    </header>
  );
};
