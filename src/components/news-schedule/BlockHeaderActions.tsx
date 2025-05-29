
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatTime } from "./utils";

interface BlockHeaderActionsProps {
  totalTime: number;
  onAddItem: () => void;
  onDeleteClick: () => void;
  newItemBlock: string | null;
  blockId: string;
  isEspelhoOpen: boolean;
  canAddItem: boolean;
}

export const BlockHeaderActions = ({
  totalTime,
  onAddItem,
  onDeleteClick,
  newItemBlock,
  blockId,
  isEspelhoOpen,
  canAddItem
}: BlockHeaderActionsProps) => {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">
        Tempo: {formatTime(totalTime)}
      </span>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDeleteClick}
              disabled={!isEspelhoOpen || !canAddItem}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          {!isEspelhoOpen && (
            <TooltipContent>
              Abra o espelho para excluir
            </TooltipContent>
          )}
          {!canAddItem && isEspelhoOpen && (
            <TooltipContent>
              Sem permissão para excluir
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={onAddItem}
                disabled={(newItemBlock === blockId || !isEspelhoOpen || !canAddItem)}
              >
                <PlusCircle className="h-4 w-4 mr-1" /> Nova Matéria
              </Button>
            </div>
          </TooltipTrigger>
          {!isEspelhoOpen && (
            <TooltipContent>
              Abra o espelho para adicionar matérias
            </TooltipContent>
          )}
          {!canAddItem && isEspelhoOpen && (
            <TooltipContent>
              Sem permissão para adicionar matérias
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
