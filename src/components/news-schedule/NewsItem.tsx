
import { Materia } from "@/types";
import { NewsItemRow } from "./NewsItemRow";

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
  // Clipboard selection props
  isClipboardSelected?: boolean;
  onToggleClipboardSelection?: (item: Materia) => void;
}

export const NewsItem = (props: NewsItemProps) => {
  return <NewsItemRow {...props} />;
};
