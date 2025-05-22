
import { Materia } from "@/types";

export const useItemOperations = (
  onEditItem: (item: any) => void,
  handleMateriaEdit?: (item: Materia) => void,
  onSaveCallback?: (updatedItem: Materia) => void
) => {
  // Wrapper function para o handleItemClick que também chama o handleMateriaEdit
  const handleItemClick = (item: any) => {
    // Anexa o callback de salvamento ao item para que seja recuperado no painel de edição
    const itemWithCallback = {
      ...item,
      _onSave: (updatedItem: Materia) => {
        console.log("Save callback triggered for item:", updatedItem.id);
        
        if (handleMateriaEdit) {
          console.log("Calling handleMateriaEdit");
          handleMateriaEdit(updatedItem);
        }
        
        if (onSaveCallback) {
          console.log("Calling onSaveCallback");
          onSaveCallback(updatedItem);
        }
      }
    };

    // Chama o manipulador de edição original dos props
    onEditItem(itemWithCallback);
  };

  return {
    handleItemClick
  };
};
