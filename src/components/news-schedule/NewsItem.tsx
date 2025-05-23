
import { useState } from "react";
import { Materia } from "@/types";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { formatTime } from "./formatting";
import { getStatusClass } from "./utils";

interface NewsItemProps {
  item: Materia;
  draggableProps?: any;
  dragHandleProps?: any;
  isEspelhoOpen: boolean;
  onDelete: (item: Materia) => void;
  onEdit: (item: Materia) => void;
}

export const NewsItem = ({ 
  item, 
  draggableProps, 
  dragHandleProps, 
  isEspelhoOpen,
  onDelete,
  onEdit 
}: NewsItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Check if the item has the highlight property
  const isHighlighted = (item as any)._highlight === true;
  
  return (
    <tr 
      ref={draggableProps?.innerRef}
      {...draggableProps}
      {...dragHandleProps}
      className={`hover:bg-gray-50 transition-colors ${
        isHovered ? "bg-gray-50" : ""
      } ${isHighlighted ? "bg-green-50 animate-pulse" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={() => isEspelhoOpen && onEdit(item)}
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
                  disabled={!isEspelhoOpen}
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
                  disabled={!isEspelhoOpen}
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
