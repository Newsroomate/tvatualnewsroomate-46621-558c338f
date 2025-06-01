
import { useState, useCallback } from "react";
import { Materia } from "@/types";

interface UseBatchSelectionProps {
  items: Materia[];
}

export const useBatchSelection = ({ items }: UseBatchSelectionProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchMode, setIsBatchMode] = useState(false);

  const toggleItemSelection = useCallback((itemId: string) => {
    setSelectedIds(prev => {
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
    setSelectedIds(new Set(items.map(item => item.id)));
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((itemId: string) => {
    return selectedIds.has(itemId);
  }, [selectedIds]);

  const getSelectedItems = useCallback(() => {
    return items.filter(item => selectedIds.has(item.id));
  }, [items, selectedIds]);

  const toggleBatchMode = useCallback(() => {
    setIsBatchMode(prev => !prev);
    // Clear selection when exiting batch mode
    if (isBatchMode) {
      clearSelection();
    }
  }, [isBatchMode, clearSelection]);

  const selectedCount = selectedIds.size;
  const totalCount = items.length;

  return {
    selectedIds,
    selectedCount,
    totalCount,
    isBatchMode,
    setIsBatchMode,
    toggleBatchMode,
    toggleItemSelection,
    selectAll,
    clearSelection,
    isSelected,
    getSelectedItems
  };
};
