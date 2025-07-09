
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, Copy, Clipboard } from "lucide-react";
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
  onCopy: (item: Materia) => void;
  isEspelhoOpen: boolean;
  canModify?: boolean;
}

export const NewsItemActions = ({
  item,
  onEdit,
  onDelete,
  onDuplicate,
  onCopy,
  isEspelhoOpen,
  canModify = true
}: NewsItemActionsProps) => {
  const handleCopyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Botão copiar clicado para matéria:', item.retranca);
    onCopy(item);
  };

  return (
    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => onEdit(item)}
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
              onClick={handleCopyClick}
              disabled={!isEspelhoOpen || !canModify}
              className="text-blue-600 hover:text-blue-800"
            >
              <Clipboard className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {!isEspelhoOpen 
              ? "Abra o espelho para copiar" 
              : !canModify 
                ? "Sem permissão para copiar"
                : "Copiar matéria (Ctrl+C)"
            }
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => onDuplicate(item)}
              disabled={!isEspelhoOpen || !canModify}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {!isEspelhoOpen 
              ? "Abra o espelho para duplicar" 
              : !canModify 
                ? "Sem permissão para duplicar"
                : "Duplicar matéria"
            }
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-red-600 hover:text-red-800"
              onClick={() => onDelete(item)}
              disabled={!isEspelhoOpen || !canModify}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {!isEspelhoOpen 
              ? "Abra o espelho para excluir" 
              : !canModify 
                ? "Sem permissão para excluir"
                : "Excluir matéria"
            }
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
