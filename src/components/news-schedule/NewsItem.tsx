
import { Materia } from "@/types";
import { NewsItemActions } from "./NewsItemActions";
import { MaterialTypeBadge } from "./MaterialTypeBadge";
import { StatusBadge } from "./StatusBadge";
import { getNewsItemStyles } from "./NewsItemStyles";
import { cn } from "@/lib/utils";

interface NewsItemProps {
  item: Materia;
  onEdit: (item: Materia) => void;
  onDelete: (item: Materia) => void;
  onDuplicate: (item: Materia) => void;
  onCopy: (item: Materia) => void;
  isEspelhoOpen: boolean;
  canModifyItems: boolean;
  isSelected?: boolean;
  onItemClick?: (item: Materia) => void;
  // Batch selection props
  isBatchMode?: boolean;
  onToggleSelection?: (id: string) => void;
  isSelectedForBatch?: boolean;
}

export const NewsItem = ({
  item,
  onEdit,
  onDelete,
  onDuplicate,
  onCopy,
  isEspelhoOpen,
  canModifyItems,
  isSelected = false,
  onItemClick,
  isBatchMode = false,
  onToggleSelection,
  isSelectedForBatch = false
}: NewsItemProps) => {
  const styles = getNewsItemStyles(item.tipo_material);

  const handleItemClick = () => {
    console.log('NewsItem clicado:', item.retranca, 'isSelected:', isSelected);
    
    if (isBatchMode && onToggleSelection) {
      onToggleSelection(item.id);
    } else if (onItemClick) {
      console.log('Chamando onItemClick para:', item.retranca);
      onItemClick(item);
    }
  };

  const handleCopyClick = (materia: Materia) => {
    console.log('NewsItem: Copiando matéria via botão:', materia.retranca);
    onCopy(materia);
  };

  return (
    <div
      onClick={handleItemClick}
      className={cn(
        "group border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all cursor-pointer bg-white",
        isSelected && "ring-2 ring-blue-500 bg-blue-50",
        isSelectedForBatch && "ring-2 ring-purple-500 bg-purple-50",
        styles.bgColor,
        styles.borderColor
      )}
      data-item-id={item.id}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          {/* Header with ordem and retranca */}
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
              {item.ordem}
            </span>
            <h3 className="font-semibold text-gray-900 truncate">
              {item.retranca}
            </h3>
            <div className="flex gap-1">
              <MaterialTypeBadge tipo={item.tipo_material} />
              <StatusBadge status={item.status} />
            </div>
          </div>

          {/* Content row */}
          <div className="grid grid-cols-12 gap-2 text-sm text-gray-600">
            <div className="col-span-3">
              <span className="font-medium">Clip:</span>
              <div>{item.clip || "—"}</div>
            </div>
            <div className="col-span-2">
              <span className="font-medium">Duração:</span>
              <div>
                {item.duracao ? 
                  `${Math.floor(item.duracao / 60)}:${(item.duracao % 60).toString().padStart(2, '0')}` 
                  : "—"
                }
              </div>
            </div>
            <div className="col-span-2">
              <span className="font-medium">Página:</span>
              <div>{item.pagina || "—"}</div>
            </div>
            <div className="col-span-3">
              <span className="font-medium">Repórter:</span>
              <div>{item.reporter || "—"}</div>
            </div>
            <div className="col-span-2">
              <span className="font-medium">Local:</span>
              <div>{item.local_gravacao || "—"}</div>
            </div>
          </div>

          {/* Additional info if present */}
          {(item.cabeca || item.gc) && (
            <div className="mt-2 text-xs text-gray-500">
              {item.cabeca && <div><strong>Cabeça:</strong> {item.cabeca}</div>}
              {item.gc && <div><strong>GC:</strong> {item.gc}</div>}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0">
          <NewsItemActions
            item={item}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onCopy={handleCopyClick}
            isEspelhoOpen={isEspelhoOpen}
            canModify={canModifyItems}
          />
        </div>
      </div>
    </div>
  );
};
