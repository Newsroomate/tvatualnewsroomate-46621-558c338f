
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, Copy } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Materia } from "@/types";

interface ItemActionsProps {
  item: Materia;
  onEdit: (item: Materia) => void;
  onDelete: (item: Materia) => void;
  onDuplicate: (item: Materia) => void;
  isEspelhoOpen: boolean;
  canModify: boolean;
}

export const ItemActions = ({
  item,
  onEdit,
  onDelete,
  onDuplicate,
  isEspelhoOpen,
  canModify
}: ItemActionsProps) => {
  return (
    <div className="flex gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              disabled={!isEspelhoOpen || !canModify}
            >
              <Pencil className="h-4 w-4" />
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
              size="sm" 
              variant="ghost" 
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(item);
              }}
              disabled={!isEspelhoOpen || !canModify}
            >
              <Copy className="h-4 w-4" />
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
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-red-600 hover:text-red-800"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item);
              }}
              disabled={!isEspelhoOpen || !canModify}
            >
              <Trash2 className="h-4 w-4" />
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
