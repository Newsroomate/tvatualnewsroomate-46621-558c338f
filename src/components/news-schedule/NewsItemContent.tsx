
import { Checkbox } from "@/components/ui/checkbox";
import { Materia } from "@/types";
import { formatTime } from "./utils";
import { getStatusClass, getMaterialTypeClass, translateStatus } from "./NewsItemUtils";

interface NewsItemContentProps {
  item: Materia;
  isBatchMode: boolean;
  isSelected: boolean;
  canModify: boolean;
  onToggleSelection?: (itemId: string) => void;
}

export const NewsItemContent = ({
  item,
  isBatchMode,
  isSelected,
  canModify,
  onToggleSelection
}: NewsItemContentProps) => {
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
    <div>{item.reporter || '-'}</div>
  );

  return rowContent;
};
