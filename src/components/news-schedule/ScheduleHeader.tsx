
import { Button } from "@/components/ui/button";
import { ArrowDownUp, Lock, PlusCircle, Eye, Clipboard } from "lucide-react";
import { formatTime } from "./utils";
import { Telejornal, Materia } from "@/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useClipboard } from "@/context/ClipboardContext";

interface ScheduleHeaderProps {
  currentTelejornal: Telejornal | null;
  totalJournalTime: number;
  onRenumberItems: () => void;
  hasBlocks: boolean;
  onAddBlock?: () => void;
  onViewTeleprompter?: () => void;
  materias?: Materia[];
  onPasteClipboard?: () => void;
}

export const ScheduleHeader = ({
  currentTelejornal,
  totalJournalTime,
  onRenumberItems,
  hasBlocks,
  onAddBlock,
  onViewTeleprompter,
  materias = [],
  onPasteClipboard
}: ScheduleHeaderProps) => {
  const { hasClipboardData, clipboardItem } = useClipboard();

  const getClipboardTooltip = () => {
    if (!hasClipboardData) return "Nenhum conteúdo copiado";
    
    if (clipboardItem?.type === 'block') {
      return `Colar bloco "${(clipboardItem.data as any).nome}" de ${clipboardItem.sourceTelejornalName}`;
    } else {
      return `Colar matéria "${(clipboardItem.data as any).retranca}" de ${clipboardItem.sourceTelejornalName}`;
    }
  };

  return <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-10">
      <div>
        <h1 className="text-xl font-bold">
          {currentTelejornal ? currentTelejornal.nome : "Selecione um Telejornal"}
        </h1>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>
      <div className="flex gap-4 items-center">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onAddBlock}
          disabled={!currentTelejornal?.espelho_aberto}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Adicionar Novo Bloco
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onViewTeleprompter}
          disabled={!currentTelejornal}
        >
          <Eye className="h-4 w-4 mr-2" />
          Visualizar Teleprompter
        </Button>

        {hasClipboardData && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onPasteClipboard}
                    disabled={!currentTelejornal?.espelho_aberto}
                    className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                  >
                    <Clipboard className="h-4 w-4 mr-2" />
                    Colar
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {getClipboardTooltip()}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button variant="outline" size="sm" onClick={onRenumberItems} disabled={!currentTelejornal?.espelho_aberto || !hasBlocks}>
                  <ArrowDownUp className="h-4 w-4 mr-2" />
                  Reordenar Numeração
                </Button>
              </div>
            </TooltipTrigger>
            {!currentTelejornal?.espelho_aberto && <TooltipContent>
                Abra o espelho para reorganizar a numeração
              </TooltipContent>}
          </Tooltip>
        </TooltipProvider>
        
        <div className="text-right">
          <p className="text-sm font-medium">Tempo Total:</p>
          <p className="text-lg font-bold">{formatTime(totalJournalTime)}</p>
        </div>
      </div>
    </div>;
};
