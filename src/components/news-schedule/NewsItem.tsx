
import { Materia } from "@/types";
import { ResizableRow } from "./ResizableRow";
import { NewsItemContent } from "./NewsItemContent";
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
  const contentCells = NewsItemContent({
    item,
    isBatchMode,
    isSelected,
    canModify,
    onToggleSelection
  });

  // Add actions column
  const actionCell = (
    <NewsItemActions
      item={item}
      onEdit={onEdit}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      isEspelhoOpen={isEspelhoOpen}
      canModify={canModify}
    />
  );

  const allCells = [...contentCells, actionCell];
  
  return (
    <ResizableRow
      provided={provided}
      snapshot={snapshot}
      isSelected={isSelected}
      onDoubleClick={() => onDoubleClick(item)}
    >
      {allCells}
    </ResizableRow>
  );
};
