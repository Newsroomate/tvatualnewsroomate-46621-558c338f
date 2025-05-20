
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Materia } from "@/types";
import { formatTime } from "./utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NewsItemProps {
  item: Materia;
  onEdit: (item: Materia) => void;
  onDelete: (item: Materia) => void;
  provided: any;
  snapshot: any;
  isEspelhoOpen: boolean;
  onDoubleClick: (item: Materia) => void;
}

export const NewsItem = ({ 
  item, 
  onEdit, 
  onDelete, 
  provided, 
  snapshot,
  isEspelhoOpen,
  onDoubleClick
}: NewsItemProps) => {
  // Status color classes
  const getStatusClass = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <tr 
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`hover:bg-gray-50 transition-colors ${
        snapshot.isDragging ? "bg-blue-50" : ""
      }`}
      onDoubleClick={() => onDoubleClick(item)}
    >
      <td className="py-2 px-4">{item.pagina}</td>
      <td className="py-2 px-4 font-medium">{item.retranca}</td>
      <td className="py-2 px-4 font-mono text-xs">{item.clip}</td>
      <td className="py-2 px-4">{formatTime(item.duracao)}</td>
      <td className="py-2 px-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(item.status)}`}>
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
