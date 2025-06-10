
import { useState } from 'react';

export const useItemSelection = () => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const selectItem = (itemId: string) => {
    setSelectedItemId(itemId);
  };

  const clearSelection = () => {
    setSelectedItemId(null);
  };

  const isSelected = (itemId: string) => {
    return selectedItemId === itemId;
  };

  return {
    selectedItemId,
    selectItem,
    clearSelection,
    isSelected
  };
};
