
import { Button } from "@/components/ui/button";
import { Trash2, Pencil } from "lucide-react";
import { Materia } from "@/types";
import { formatTime, getStatusClass, translateStatus } from "./utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useEffect } from "react";

interface NewsItemProps {
  item: Materia;
  onEdit: (item: Materia) => void;
  onDelete: (item: Materia) => void;
  provided: any;
  snapshot: any;
  isEspelhoOpen: boolean;
  onDoubleClick: (item: Materia) => void;
  canModify?: boolean;
}

export const NewsItem = ({ 
  item, 
  onEdit, 
  onDelete, 
  provided, 
  snapshot,
  isEspelhoOpen,
  onDoubleClick,
  canModify = true
}: NewsItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);
  
  // Adiciona efeito de destaque quando os props do item mudam (exceto para operações de arrastar)
  useEffect(() => {
    // Ignora o destaque durante operações de arrastar
    if (snapshot.isDragging) return;
    
    setIsHighlighted(true);
    const timer = setTimeout(() => {
      setIsHighlighted(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [item.retranca, item.duracao, item.status, item.reporter]);

  // Manipula clique de edição com feedback aprimorado
  const handleEdit = () => {
    if (isEspelhoOpen && canModify) {
      // Define o estado de edição para fornecer feedback visual
      setIsEditing(true);
      
      // Chama o manipulador onEdit
      onEdit(item);
      
      // Redefine o estado de edição após um curto atraso para garantir que a interface pareça responsiva
      setTimeout(() => {
        setIsEditing(false);
      }, 300);
    }
  };

  // Manipula duplo clique com feedback
  const handleDoubleClick = () => {
    if (isEspelhoOpen && canModify) {
      setIsEditing(true);
      onDoubleClick(item);
      
      setTimeout(() => {
        setIsEditing(false);
      }, 300);
    }
  };

  // Garante que tenhamos dados válidos para exibição
  const displayRetranca = item.retranca || "Sem título";
  const displayStatus = item.status || "draft";
  const displayDuracao = item.duracao || 0;
  
  return (
    <tr 
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`hover:bg-gray-50 transition-colors ${
        snapshot.isDragging ? "bg-blue-50" : ""
      } ${isHighlighted ? "bg-yellow-50 animate-pulse" : ""} ${
        isEditing ? "opacity-70" : ""
      }`}
      onDoubleClick={handleDoubleClick}
    >
      <td className="py-2 px-4">{item.pagina}</td>
      <td className="py-2 px-4 font-medium">{displayRetranca}</td>
      <td className="py-2 px-4 font-mono text-xs">{item.clip || ''}</td>
      <td className="py-2 px-4">{formatTime(displayDuracao)}</td>
      <td className="py-2 px-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(displayStatus)}`}>
          {translateStatus(displayStatus)}
        </span>
      </td>
      <td className="py-2 px-4">{item.reporter || '-'}</td>
      <td className="py-2 px-4">
        <div className="flex gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleEdit}
                  disabled={!isEspelhoOpen || !canModify || isEditing}
                  className={`hover:bg-blue-50 transition-colors ${isEditing ? 'opacity-50 bg-blue-50' : ''}`}
                >
                  <Pencil className={`h-4 w-4 ${isEditing ? 'text-blue-500' : ''}`} />
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
              {isEditing && (
                <TooltipContent>
                  Processando...
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
                  onClick={() => onDelete(item)}
                  disabled={!isEspelhoOpen || !canModify || isEditing}
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
      </td>
    </tr>
  );
};
