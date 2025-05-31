
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Bloco, Materia, Telejornal } from "@/types";
import { useItemCreation } from "./useItemCreation";
import { useItemDuplication } from "./useItemDuplication";
import { useItemDeletion } from "./useItemDeletion";
import { useItemRenumbering } from "./useItemRenumbering";

interface UseItemManagementProps {
  blocks: (Bloco & { items: Materia[], totalTime: number })[];
  setBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[], totalTime: number })[]>>;
  currentTelejornal: Telejornal | null;
  newItemBlock: string | null;
  setNewItemBlock: React.Dispatch<React.SetStateAction<string | null>>;
  deleteConfirmOpen: boolean;
  setDeleteConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>;
  materiaToDelete: Materia | null;
  setMateriaToDelete: React.Dispatch<React.SetStateAction<Materia | null>>;
  renumberConfirmOpen: boolean;
  setRenumberConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useItemManagement = ({
  blocks,
  setBlocks,
  currentTelejornal,
  newItemBlock,
  setNewItemBlock,
  deleteConfirmOpen,
  setDeleteConfirmOpen,
  materiaToDelete,
  setMateriaToDelete,
  renumberConfirmOpen,
  setRenumberConfirmOpen
}: UseItemManagementProps) => {
  const { toast } = useToast();

  // Item creation logic
  const { handleAddItem } = useItemCreation({
    blocks,
    setBlocks,
    currentTelejornal,
    newItemBlock,
    setNewItemBlock
  });

  // Item duplication logic
  const { handleDuplicateItem } = useItemDuplication({
    blocks,
    setBlocks,
    currentTelejornal
  });

  // Item deletion logic
  const { handleDeleteMateria, confirmDeleteMateria } = useItemDeletion({
    blocks,
    setBlocks,
    currentTelejornal,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    materiaToDelete,
    setMateriaToDelete
  });

  // Item renumbering logic
  const { handleRenumberItems, confirmRenumberItems } = useItemRenumbering({
    blocks,
    setBlocks,
    currentTelejornal,
    renumberConfirmOpen,
    setRenumberConfirmOpen
  });

  return {
    handleAddItem,
    handleDuplicateItem,
    handleDeleteMateria,
    confirmDeleteMateria,
    handleRenumberItems,
    confirmRenumberItems
  };
};
