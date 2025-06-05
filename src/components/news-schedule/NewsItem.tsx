
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, Copy } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Materia } from "@/types";
import { formatTime } from "./utils";
import { ResizableRow } from "./ResizableRow";
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
  onDuplicate: (item: Materia) => void;
  provided: any;
  snapshot: any;
  isEspelhoOpen: boolean;
  onDoubleClick: (item: Materia) => void;
  canModify?: boolean;
  // Batch selection props
  isBatchMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (itemId: string) => void;
}

export const NewsItem = ({ 
  item, 
  onEdit, 
  onDelete,
  onDuplicate,
  provided, 
  snapshot,
  isEspelhoOpen,
  onDoubleClick,
  canModify = true,
  // Batch selection props
  isBatchMode = false,
  isSelected = false,
  onToggleSelection
}: NewsItemProps) => {
  // Status color classes
  const getStatusClass = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Material type color classes - soft and subtle colors
  const getMaterialTypeClass = (tipo: string): string => {
    switch (tipo?.toUpperCase()) {
      case 'VT': return 'bg-red-50 text-red-700 border border-red-200';
      case 'SUP': return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
      case 'IMG': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'EST': return 'bg-green-50 text-green-700 border border-green-200';
      case 'LINK': return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'SELO': return 'bg-orange-50 text-orange-700 border border-orange-200';
      case 'VHT': return 'bg-pink-50 text-pink-700 border border-pink-200';
      case 'SON': return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
      case 'NET': return 'bg-teal-50 text-teal-700 border border-teal-200';
      default: return 'bg-gray-50 text-gray-600 border border-gray-200';
    }
  };

  // Tradução do status para português
  const translateStatus = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'published': return 'Publicado';
      case 'draft': return 'Rascunho';
      case 'pending': return 'Pendente';
      case 'urgent': return 'Urgente';
      default: return status || 'Rascunho';
    }
  };

  // Ensure we have valid data for display
  const displayRetranca = item.retranca || "Sem título";
  const displayStatus = item.status || "draft";
  const displayDuracao = item.duracao || 0;

  const handleCheckboxChange = (checked: boolean) => {
    if (onToggleSelection) {
      onToggleSelection(item.id);
    }
  };

  const rowContent = [];

  // Checkbox column for batch selection
  if (isBatchMode) {
    rowContent.push(
      <div className="w-12">
        <Checkbox
          checked={isSelected}
          onCheckedChange={handleCheckboxChange}
          disabled={!canModify}
        />
      </div>
    );
  }

  // Add all other columns
  rowContent.push(
    // Página
    <div className="font-medium">{item.pagina}</div>,
    
    // Notas (Tipo de Material)
    <div>
      {item.tipo_material ? (
        <span className={`px-2 py-1 rounded-md text-xs font-medium ${getMaterialTypeClass(item.tipo_material)}`}>
          {item.tipo_material}
        </span>
      ) : (
        <span className="text-gray-400">-</span>
      )}
    </div>,
    
    // Retranca
    <div className="font-medium">{displayRetranca}</div>,
    
    // Clipe
    <div className="font-mono text-xs">{item.clip || ''}</div>,
    
    // Duração
    <div>{formatTime(displayDuracao)}</div>,
    
    // Status
    <div>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(displayStatus)}`}>
        {translateStatus(displayStatus)}
      </span>
    </div>,
    
    // Reporter
    <div>{item.reporter || '-'}</div>,
    
    // Ações
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
    </div>
  );
  
  return (
    <ResizableRow
      provided={provided}
      snapshot={snapshot}
      isSelected={isSelected}
      onDoubleClick={() => onDoubleClick(item)}
    >
      {rowContent}
    </ResizableRow>
  );
};
