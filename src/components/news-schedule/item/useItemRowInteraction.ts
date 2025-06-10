
import { Materia } from "@/types";

interface UseItemRowInteractionProps {
  item: Materia;
  snapshot: any;
  isSelected: boolean;
  isItemSelected: boolean;
  onItemSelect?: (itemId: string) => void;
}

export const useItemRowInteraction = ({
  item,
  snapshot,
  isSelected,
  isItemSelected,
  onItemSelect
}: UseItemRowInteractionProps) => {
  const handleRowClick = (e: React.MouseEvent) => {
    // Don't trigger selection if clicking on buttons or checkboxes
    if (e.target instanceof HTMLElement) {
      const isInteractiveElement = e.target.closest('button, input, [role="button"]');
      if (isInteractiveElement) return;
    }

    // Handle item selection on click
    if (onItemSelect) {
      onItemSelect(item.id);
    }
  };

  // Define row background classes based on state
  const getRowClasses = () => {
    const baseClasses = "transition-colors cursor-pointer";
    
    if (snapshot.isDragging) {
      return `${baseClasses} bg-blue-50`;
    }
    
    if (isSelected) {
      return `${baseClasses} bg-blue-50`;
    }
    
    if (isItemSelected) {
      return `${baseClasses} bg-gray-100 hover:bg-gray-150`;
    }
    
    return `${baseClasses} hover:bg-gray-50`;
  };

  return {
    handleRowClick,
    getRowClasses
  };
};
