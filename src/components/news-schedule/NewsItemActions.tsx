
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, Copy, Target, Monitor } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Materia } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { hasSufficientContent } from "@/utils/teleprompter-utils";
import { useToast } from "@/hooks/use-toast";

interface NewsItemActionsProps {
  item: Materia;
  onEdit: (item: Materia) => void;
  onDelete: (item: Materia) => void;
  onDuplicate: (item: Materia) => void;
  onFocusInTeleprompter?: (item: Materia) => void;
  onOpenSingleTeleprompter?: (item: Materia) => void;
  isEspelhoOpen: boolean;
  canModify?: boolean;
}

export const NewsItemActions = ({
  item,
  onEdit,
  onDelete,
  onDuplicate,
  onFocusInTeleprompter,
  onOpenSingleTeleprompter,
  isEspelhoOpen,
  canModify = true
}: NewsItemActionsProps) => {
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const handleSingleTeleprompter = () => {
    if (!hasSufficientContent(item)) {
      toast({
        title: "Conteúdo insuficiente",
        description: "Esta matéria não possui texto, cabeça ou GC suficiente para o teleprompter.",
        variant: "destructive"
      });
      return;
    }

    if (onOpenSingleTeleprompter) {
      onOpenSingleTeleprompter(item);
      toast({
        title: "Teleprompter aberto",
        description: `Teleprompter aberto para: ${item.retranca}`,
      });
    }
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
              onClick={() => onDuplicate(item)}
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

      {/* Mobile-only Single Teleprompter Button */}
      {isMobile && onOpenSingleTeleprompter && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleSingleTeleprompter}
                className="text-purple-600 hover:text-purple-800"
              >
                <Monitor className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Abrir no teleprompter
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {onFocusInTeleprompter && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => onFocusInTeleprompter(item)}
                className="text-blue-600 hover:text-blue-800"
              >
                <Target className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Centralizar no teleprompter
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {!isMobile && (
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
      )}
    </div>
  );
};
