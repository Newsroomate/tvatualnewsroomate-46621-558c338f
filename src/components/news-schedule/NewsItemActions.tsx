
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, Copy, Target } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Materia } from "@/types";

interface NewsItemActionsProps {
  item: Materia;
  onEdit: (item: Materia) => void;
  onDelete: (item: Materia) => void;
  onDuplicate: (item: Materia) => void;
  onFocusInTeleprompter?: (item: Materia) => void;
  isEspelhoOpen: boolean;
  canModify?: boolean;
  isMobile?: boolean;
}

export const NewsItemActions = ({
  item,
  onEdit,
  onDelete,
  onDuplicate,
  onFocusInTeleprompter,
  isEspelhoOpen,
  canModify = true,
  isMobile = false
}: NewsItemActionsProps) => {
  return (
    <div className={`flex ${isMobile ? 'gap-0.5' : 'gap-1'}`} onClick={(e) => e.stopPropagation()}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size={isMobile ? "sm" : "sm"}
              variant="ghost" 
              onClick={() => onEdit(item)}
              disabled={!isEspelhoOpen || !canModify}
              className={isMobile ? "h-7 w-7 p-0" : ""}
            >
              <Pencil className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
            </Button>
          </TooltipTrigger>
          {!isEspelhoOpen && (
            <TooltipContent>
              Abra o espelho para editar
            </TooltipContent>
          )}
          {!canModify && isEspelhoOpen && (
            <TooltipContent>
              Sem permissão para editar
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size={isMobile ? "sm" : "sm"}
              variant="ghost" 
              onClick={() => onDuplicate(item)}
              disabled={!isEspelhoOpen || !canModify}
              className={isMobile ? "h-7 w-7 p-0" : ""}
            >
              <Copy className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
            </Button>
          </TooltipTrigger>
          {!isEspelhoOpen && (
            <TooltipContent>
              Abra o espelho para duplicar
            </TooltipContent>
          )}
          {!canModify && isEspelhoOpen && (
            <TooltipContent>
              Sem permissão para duplicar
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      {onFocusInTeleprompter && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size={isMobile ? "sm" : "sm"}
                variant="ghost" 
                onClick={() => onFocusInTeleprompter(item)}
                className={`text-blue-600 hover:text-blue-800 ${isMobile ? "h-7 w-7 p-0" : ""}`}
              >
                <Target className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Centralizar no teleprompter
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size={isMobile ? "sm" : "sm"}
              variant="ghost" 
              className={`text-red-600 hover:text-red-800 ${isMobile ? "h-7 w-7 p-0" : ""}`}
              onClick={() => onDelete(item)}
              disabled={!isEspelhoOpen || !canModify}
            >
              <Trash2 className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
            </Button>
          </TooltipTrigger>
          {!isEspelhoOpen && (
            <TooltipContent>
              Abra o espelho para excluir
            </TooltipContent>
          )}
          {!canModify && isEspelhoOpen && (
            <TooltipContent>
              Sem permissão para excluir
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
