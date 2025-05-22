
import { Materia } from "@/types";

export const useItemOperations = (
  onEditItem: (item: any) => void,
  handleMateriaEdit?: (item: Materia) => void
) => {
  // Create a wrapper function for handleItemClick that also calls our new handleMateriaEdit
  const handleItemClick = (item: any) => {
    // Call the original edit handler from props
    onEditItem(item);
    
    // Also call our new handler for improved update handling
    if (handleMateriaEdit) {
      handleMateriaEdit(item);
    }
  };

  return {
    handleItemClick
  };
};
