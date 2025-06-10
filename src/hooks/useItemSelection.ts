
import { useState, useCallback } from "react";

export const useItemSelection = () => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const selectItem = useCallback((itemId: string) => {
    setSelectedItemId(prev => prev === itemId ? null : itemId);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItemId(null);
  }, []);

  const isItemSelected = useCallback((itemId: string) => {
    return selectedItemId === itemId;
  }, [selectedItemId]);

  return {
    selectedItemId,
    selectItem,
    clearSelection,
    isItemSelected
  };
};
