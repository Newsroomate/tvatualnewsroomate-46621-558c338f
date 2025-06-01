
import { useState, useCallback } from "react";
import { Materia } from "@/types";

export const useBatchSelection = (items: Materia[] = []) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isBatchMode, setIsBatchMode] = useState(false);

  const toggleBatchMode = useCallback(() => {
    setIsBatchMode(prev => !prev);
    if (isBatchMode) {
      setSelectedItems(new Set());
    }
  }, [isBatchMode]);

  const toggleItemSelection = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    const allIds = items.map(item => item.id);
    setSelectedItems(new Set(allIds));
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const isSelected = useCallback((itemId: string) => {
    return selectedItems.has(itemId);
  }, [selectedItems]);

  const selectedCount = selectedItems.size;
  const allSelected = items.length > 0 && selectedItems.size === items.length;

  return {
    selectedItems: Array.from(selectedItems),
    selectedCount,
    allSelected,
    isBatchMode,
    toggleBatchMode,
    toggleItemSelection,
    selectAll,
    clearSelection,
    isSelected,
    setSelectedItems
  };
};
