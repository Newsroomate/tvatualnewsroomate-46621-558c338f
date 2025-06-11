
import { useState, useCallback } from 'react';
import { Materia } from '@/types';

export const useOptimizedItemSelection = () => {
  const [selectedMateria, setSelectedMateria] = useState<Materia | null>(null);

  const selectItem = useCallback((materia: Materia | null) => {
    console.log('Selecionando matéria:', materia?.retranca || 'nenhuma');
    setSelectedMateria(materia);
  }, []);

  const clearSelection = useCallback(() => {
    console.log('Limpando seleção de matéria');
    setSelectedMateria(null);
  }, []);

  const isSelected = useCallback((itemId: string) => {
    return selectedMateria?.id === itemId;
  }, [selectedMateria?.id]);

  const toggleSelection = useCallback((materia: Materia) => {
    if (selectedMateria?.id === materia.id) {
      clearSelection();
    } else {
      selectItem(materia);
    }
  }, [selectedMateria?.id, selectItem, clearSelection]);

  return {
    selectedMateria,
    selectedItemId: selectedMateria?.id || null,
    selectItem,
    clearSelection,
    isSelected,
    toggleSelection
  };
};
