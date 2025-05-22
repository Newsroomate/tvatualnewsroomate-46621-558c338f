
import { useState } from "react";
import { Materia, Telejornal } from "@/types";
import { BlockWithItems } from "./useRealtimeMaterias/utils";
import { useAddItem } from "./materia-operations/useAddItem";
import { useDeleteItem } from "./materia-operations/useDeleteItem";
import { useDragOperations } from "./materia-operations/useDragOperations";
import { useRenumberItems } from "./materia-operations/useRenumberItems";

export const useMateriaOperations = (
  setBlocks?: React.Dispatch<React.SetStateAction<BlockWithItems[]>>,
  currentTelejornal?: Telejornal | null,
  setMateriaToDelete?: React.Dispatch<React.SetStateAction<Materia | null>>,
  setDeleteConfirmOpen?: React.Dispatch<React.SetStateAction<boolean>>,
  setNewItemBlock?: React.Dispatch<React.SetStateAction<string | null>>
) => {
  // Use the add item hook
  const {
    newItemBlock,
    setNewItemBlock: setNewItemBlockState,
    handleAddItem
  } = useAddItem(setBlocks, currentTelejornal, setNewItemBlock);
  
  // Use the delete item hook
  const {
    materiaToDelete,
    setMateriaToDelete: setMateriaToDeleteState,
    deleteConfirmOpen,
    setDeleteConfirmOpen: setDeleteConfirmOpenState,
    handleDeleteMateria,
    confirmDeleteMateria
  } = useDeleteItem(setBlocks, currentTelejornal, setMateriaToDelete, setDeleteConfirmOpen);
  
  // Use the drag operations hook
  const {
    handleDragEnd
  } = useDragOperations(setBlocks, currentTelejornal);
  
  // Use the renumber items hook
  const {
    handleRenumberItems,
    confirmRenumberItems
  } = useRenumberItems(setBlocks, currentTelejornal);

  return {
    // Add item
    newItemBlock,
    setNewItemBlock: setNewItemBlockState,
    handleAddItem,
    
    // Delete item
    materiaToDelete,
    setMateriaToDelete: setMateriaToDeleteState,
    deleteConfirmOpen,
    setDeleteConfirmOpen: setDeleteConfirmOpenState,
    handleDeleteMateria,
    confirmDeleteMateria,
    
    // Drag operations
    handleDragEnd,
    
    // Renumber operations
    handleRenumberItems,
    confirmRenumberItems
  };
};
