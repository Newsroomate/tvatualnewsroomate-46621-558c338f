
import { Checkbox } from "@/components/ui/checkbox";
import { Materia } from "@/types";
import { formatTime } from "./utils";
import { MaterialTypeBadge } from "./MaterialTypeBadge";
import { StatusBadge } from "./StatusBadge";
import { NewsItemActions } from "./NewsItemActions";

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
  // Visual selection props
  isVisuallySelected?: boolean;
  onItemClick?: (materia: Materia) => void;
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
  onToggleSelection,
  // Visual selection props
  isVisuallySelected = false,
  onItemClick
}: NewsItemProps) => {
  // Ensure we have valid data for display
  const displayRetranca = item.retranca || "Sem título";
  const displayStatus = item.status || "draft";
  const displayDuracao = item.duracao || 0;

  const handleCheckboxChange = (checked: boolean) => {
    if (onToggleSelection) {
      onToggleSelection(item.id);
    }
  };

  const handleRowClick = () => {
    if (onItemClick && !isBatchMode) {
      onItemClick(item);
    }
  };

  // Determine row styling based on selection and drag state
  const getRowStyling = () => {
    let classes = "hover:bg-gray-50 transition-colors cursor-pointer";
    
    if (snapshot.isDragging) {
      classes += " bg-blue-50";
    } else if (isVisuallySelected && !isBatchMode) {
      classes += " bg-gray-100";
    } else if (isSelected && isBatchMode) {
      classes += " bg-blue-50";
    }
    
    return classes;
  };
  
  return (
    <tr 
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={getRowStyling()}
      onDoubleClick={() => onDoubleClick(item)}
      onClick={handleRowClick}
    >
      {/* Checkbox column for batch selection */}
      {isBatchMode && (
        <td className="py-2 px-4 w-12" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleCheckboxChange}
            disabled={!canModify}
          />
        </td>
      )}
      
      <td className="py-2 px-4">{item.pagina}</td>
      <td className="py-2 px-4">
        <MaterialTypeBadge tipoMaterial={item.tipo_material} />
      </td>
      <td className="py-2 px-4 font-medium">{displayRetranca}</td>
      <td className="py-2 px-4 font-mono text-xs">{item.clip || ''}</td>
      <td className="py-2 px-4">{formatTime(displayDuracao)}</td>
      <td className="py-2 px-4">
        <StatusBadge status={displayStatus} />
      </td>
      <td className="py-2 px-4">{item.reporter || '-'}</td>
      <td className="py-2 px-4">
        <NewsItemActions
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          isEspelhoOpen={isEspelhoOpen}
          canModify={canModify}
        />
      </td>
    </tr>
  );
};
