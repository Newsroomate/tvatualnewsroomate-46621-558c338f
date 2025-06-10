
import { Checkbox } from "@/components/ui/checkbox";
import { Materia } from "@/types";
import { formatTime } from "./utils";
import { StatusDisplay } from "./item/StatusDisplay";
import { MaterialTypeDisplay } from "./item/MaterialTypeDisplay";
import { ItemActions } from "./item/ItemActions";
import { useItemRowInteraction } from "./item/useItemRowInteraction";

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
  // New selection props
  isItemSelected?: boolean;
  onItemSelect?: (itemId: string) => void;
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
  // New selection props
  isItemSelected = false,
  onItemSelect
}: NewsItemProps) => {
  // Ensure we have valid data for display
  const displayRetranca = item.retranca || "Sem título";
  const displayDuracao = item.duracao || 0;

  const handleCheckboxChange = (checked: boolean) => {
    if (onToggleSelection) {
      onToggleSelection(item.id);
    }
  };

  const { handleRowClick, getRowClasses } = useItemRowInteraction({
    item,
    snapshot,
    isSelected,
    isItemSelected,
    onItemSelect
  });
  
  return (
    <tr 
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={getRowClasses()}
      onDoubleClick={() => onDoubleClick(item)}
      onClick={handleRowClick}
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
        <MaterialTypeDisplay tipo={item.tipo_material} />
      </td>
      <td className="py-2 px-4 font-medium">{displayRetranca}</td>
      <td className="py-2 px-4 font-mono text-xs">{item.clip || ''}</td>
      <td className="py-2 px-4">{formatTime(displayDuracao)}</td>
      <td className="py-2 px-4">
        <StatusDisplay status={item.status} />
      </td>
      <td className="py-2 px-4">{item.reporter || '-'}</td>
      <td className="py-2 px-4">
        <ItemActions
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
