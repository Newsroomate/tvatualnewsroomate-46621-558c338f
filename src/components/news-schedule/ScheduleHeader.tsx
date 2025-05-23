
import { Button } from "@/components/ui/button";
import { ArrowDownUp, Lock } from "lucide-react";
import { formatTime } from "./utils";
import { Telejornal } from "@/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
interface ScheduleHeaderProps {
  currentTelejornal: Telejornal | null;
  totalJournalTime: number;
  onRenumberItems: () => void;
  hasBlocks: boolean;
}
export const ScheduleHeader = ({
  currentTelejornal,
  totalJournalTime,
  onRenumberItems,
  hasBlocks
}: ScheduleHeaderProps) => {
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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onRenumberItems}
                  disabled={!currentTelejornal?.espelho_aberto || !hasBlocks}
                >
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
