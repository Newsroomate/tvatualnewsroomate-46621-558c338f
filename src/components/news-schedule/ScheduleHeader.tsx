
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowDownUp, Lock, PlaySquare } from "lucide-react";
import { formatTime } from "./utils";
import { Telejornal } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ScheduleHeaderProps {
  currentTelejornal: Telejornal | null;
  totalJournalTime: number;
  onRenumberItems: () => void;
  hasBlocks: boolean;
  blocksWithItems: any[]; // This will be used for the teleprompter
  onOpenTeleprompter: (shouldOpen: boolean) => void;
}

export const ScheduleHeader = ({ 
  currentTelejornal, 
  totalJournalTime, 
  onRenumberItems,
  hasBlocks,
  blocksWithItems,
  onOpenTeleprompter
}: ScheduleHeaderProps) => {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const handleOpenTeleprompter = () => {
    if (!currentTelejornal?.espelho_aberto) {
      return;
    }
    setConfirmDialogOpen(true);
  };

  const handleConfirmTeleprompter = () => {
    setConfirmDialogOpen(false);
    onOpenTeleprompter(true);
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-10">
      <div>
        <h1 className="text-xl font-bold">
          {currentTelejornal ? currentTelejornal.nome : "Selecione um Telejornal"}
        </h1>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>
      <div className="flex gap-2 items-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={handleOpenTeleprompter}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                disabled={!hasBlocks || !currentTelejornal?.espelho_aberto}
              >
                <PlaySquare className="h-4 w-4" />
                Visualizar Teleprompter
              </Button>
            </TooltipTrigger>
            {!hasBlocks && (
              <TooltipContent>
                Não há blocos para visualizar no teleprompter
              </TooltipContent>
            )}
            {!currentTelejornal?.espelho_aberto && (
              <TooltipContent>
                Abra o espelho para visualizar no teleprompter
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={onRenumberItems}
                variant="secondary"
                size="sm"
                className="flex items-center gap-1"
                disabled={!currentTelejornal?.espelho_aberto || !hasBlocks}
              >
                <ArrowDownUp className="h-4 w-4" />
                Reorganizar Numeração
              </Button>
            </TooltipTrigger>
            {!currentTelejornal?.espelho_aberto && (
              <TooltipContent>
                Abra o espelho para reorganizar a numeração
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        
        <div className="text-right">
          <p className="text-sm font-medium">Tempo Total:</p>
          <p className="text-lg font-bold">{formatTime(totalJournalTime)}</p>
        </div>
      </div>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar ao Teleprompter</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja enviar todos os blocos e matérias deste espelho ao teleprompter agora?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmTeleprompter}>
              Confirmar Envio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
