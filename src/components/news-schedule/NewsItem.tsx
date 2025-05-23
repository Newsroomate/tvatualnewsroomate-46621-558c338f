
import { useState } from "react";
import { Materia } from "@/types";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { formatTime } from "./formatting";
import { getStatusClass } from "./utils";
import { DraggableProvided, DraggableStateSnapshot } from "@hello-pangea/dnd";

interface NewsItemProps {
  item: Materia;
  draggableProps?: any;
  dragHandleProps?: any;
  isEspelhoOpen: boolean;
  onDelete: (item: Materia) => void;
  onEdit: (item: Materia) => void;
  provided?: DraggableProvided;
  snapshot?: DraggableStateSnapshot;
  onDoubleClick?: (item: Materia) => void;
  canModify?: boolean;
}

export const NewsItem = ({ 
  item, 
  draggableProps, 
  dragHandleProps, 
  isEspelhoOpen,
  onDelete,
  onEdit,
  provided,
  snapshot,
  onDoubleClick,
  canModify = true
}: NewsItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Check if the item has the highlight property
  const isHighlighted = (item as any)._highlight === true;
  
  // Use either direct props or provided props from Draggable
  const innerRef = provided?.innerRef || draggableProps?.innerRef;
  const dragProps = provided?.draggableProps || draggableProps;
  const handleProps = provided?.dragHandleProps || dragHandleProps;
  
  const handleDoubleClick = () => {
    if (isEspelhoOpen && onDoubleClick) {
      onDoubleClick(item);
    } else if (isEspelhoOpen) {
      onEdit(item);
    }
  };
  
  return (
    <tr 
      ref={innerRef}
      {...dragProps}
      {...handleProps}
      className={`hover:bg-gray-50 transition-colors ${
        isHovered ? "bg-gray-50" : ""
      } ${isHighlighted ? "bg-green-50 animate-pulse" : ""} ${
        snapshot?.isDragging ? "bg-blue-50" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={handleDoubleClick}
    >
      <td className="py-2 px-4">{item.pagina}</td>
      <td className="py-2 px-4 font-medium">{item.retranca}</td>
      <td className="py-2 px-4 font-mono text-xs">{item.clip}</td>
      <td className="py-2 px-4">{formatTime(item.duracao)}</td>
      <td className="py-2 px-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(item.status || '')}`}>
          {item.status}
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
                  onClick={() => onEdit(item)}
                  disabled={!isEspelhoOpen || !canModify}
                >
                  Editar
                </Button>
              </TooltipTrigger>
              {!isEspelhoOpen && (
                <TooltipContent>
                  Abra o espelho para editar
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
            </Tooltip>
          </TooltipProvider>
        </div>
      </td>
    </tr>
  );
};
