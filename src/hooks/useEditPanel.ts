
import { useState } from 'react';
import { Materia } from '@/types';

export const useEditPanel = () => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Materia | null>(null);
  const [onSaveCallback, setOnSaveCallback] = useState<((item: Materia) => void) | null>(null);

  const openEditPanel = (item: Materia) => {
    setCurrentItem(item);
    setIsEditOpen(true);
    
    // Check if the item has a _onSave callback attached
    if (item._onSave && typeof item._onSave === 'function') {
      setOnSaveCallback(() => item._onSave as (item: Materia) => void);
    } else {
      setOnSaveCallback(null);
    }
  };

  const closeEditPanel = () => {
    setIsEditOpen(false);
    setCurrentItem(null);
    setOnSaveCallback(null);
  };

  const handleSave = (updatedItem: Materia) => {
    if (onSaveCallback) {
      onSaveCallback(updatedItem);
    }
  };

  return {
    isEditOpen,
    currentItem,
    openEditPanel,
    closeEditPanel,
    handleSave
  };
};
