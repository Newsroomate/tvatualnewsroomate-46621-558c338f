
import { Checkbox } from "@/components/ui/checkbox";
import { Materia } from "@/types";
import { formatTime } from "./utils";
import { NewsItemStatusBadge } from "./NewsItemStatusBadge";
import { NewsItemTypeBadge } from "./NewsItemTypeBadge";
import { NewsItemActions } from "./NewsItemActions";

interface NewsItemRowProps {
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
  // Clipboard selection props
  isClipboardSelected?: boolean;
  onToggleClipboardSelection?: (item: Materia) => void;
}

export const NewsItemRow = ({ 
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
  // Clipboard selection props
  isClipboardSelected = false,
  onToggleClipboardSelection
}: NewsItemRowProps) => {
  // Ensure we have valid data for display
  const displayRetranca = item.retranca || "Sem título";
  const displayDuracao = item.duracao || 0;

  const handleCheckboxChange = (checked: boolean) => {
    if (onToggleSelection) {
      onToggleSelection(item.id);
    }
  };

  const handleItemClick = (event: React.MouseEvent) => {
    // Handle clipboard selection with Ctrl+Click
    if ((event.ctrlKey || event.metaKey) && onToggleClipboardSelection) {
      event.preventDefault();
      onToggleClipboardSelection(item);
    }
  };

  const isHighlighted = isSelected || isClipboardSelected;
  
  return (
    <tr 
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`hover:bg-gray-50 transition-colors cursor-pointer ${
        snapshot.isDragging ? "bg-blue-50" : ""
      } ${isHighlighted ? "bg-blue-50" : ""} ${
        isClipboardSelected ? "ring-2 ring-blue-300" : ""
      }`}
      onDoubleClick={() => onDoubleClick(item)}
      onClick={handleItemClick}
    >
      {/* Checkbox column for batch selection */}
      {isBatchMode && (
        <td className="py-2 px-4 w-12">
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleCheckboxChange}
            disabled={!canModify}
          />
        </td>
      )}
      
      <td className="py-2 px-4">{item.pagina}</td>
      <td className="py-2 px-4">
        <NewsItemTypeBadge tipo={item.tipo_material} />
      </td>
      <td className="py-2 px-4 font-medium">{displayRetranca}</td>
      <td className="py-2 px-4 font-mono text-xs">{item.clip || ''}</td>
      <td className="py-2 px-4">{formatTime(displayDuracao)}</td>
      <td className="py-2 px-4">
        <NewsItemStatusBadge status={item.status} />
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
