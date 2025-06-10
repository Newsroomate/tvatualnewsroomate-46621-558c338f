
import { useState } from 'react';
import { Materia } from '@/types';

export const useItemSelection = () => {
  const [selectedMateria, setSelectedMateria] = useState<Materia | null>(null);

  const selectItem = (materia: Materia) => {
    setSelectedMateria(materia);
  };

  const clearSelection = () => {
    setSelectedMateria(null);
  };

  const isSelected = (itemId: string) => {
    return selectedMateria?.id === itemId;
  };

  return {
    selectedMateria,
    selectedItemId: selectedMateria?.id || null,
    selectItem,
    clearSelection,
    isSelected
  };
};
