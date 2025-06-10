
import { useState } from "react";
import { Bloco, Materia } from "@/types";
import { BlockHeader } from "./BlockHeader";
import { BlockContent } from "./BlockContent";
import { useAuth } from "@/context/AuthContext";
import { canModifyMaterias } from "@/utils/permission";
import { useBatchSelection } from "@/hooks/useBatchSelection";
import { useMateriaClipboard } from "@/hooks/useMateriaClipboard";

interface NewsBlockProps {
  block: Bloco & { items: Materia[], totalTime: number };
  newItemBlock: string | null;
  onAddItem: (blockId: string) => void;
  onEditItem: (item: Materia) => void;
  onDeleteItem: (item: Materia) => void;
  onDuplicateItem: (item: Materia) => void;
  isEspelhoOpen: boolean;
  onRenameBlock: (blockId: string, newName: string) => void;
  onDeleteBlock: (blockId: string) => void;
  journalPrefix?: string;
  onBatchDeleteItems: (items: Materia[]) => void;
  isDeleting?: boolean;
  onPasteMaterias?: (materias: Partial<Materia>[], targetMateria?: Materia) => void;
  currentTelejornalId?: string;
}

export const NewsBlock = ({
  block,
  newItemBlock,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onDuplicateItem,
  isEspelhoOpen,
  onRenameBlock,
  onDeleteBlock,
  journalPrefix = "default",
  onBatchDeleteItems,
  isDeleting = false,
  onPasteMaterias,
  currentTelejornalId
}: NewsBlockProps) => {
  const { profile } = useAuth();
  const canModify = canModifyMaterias(profile);
  
  // Batch selection functionality
  const {
    selectedItems,
    selectedCount,
    allSelected,
    isBatchMode,
    toggleBatchMode,
    toggleItemSelection,
    selectAll,
    clearSelection,
    isSelected,
    setSelectedItems
  } = useBatchSelection(block.items);

  // Clipboard selection state
  const [clipboardSelectedMaterias, setClipboardSelectedMaterias] = useState<Materia[]>([]);
  const [selectedMateria, setSelectedMateria] = useState<Materia | null>(null);

  // Get selected materias for clipboard operations
  const getSelectedMaterias = () => {
    if (clipboardSelectedMaterias.length > 0) {
      return clipboardSelectedMaterias;
    }
    if (selectedItems.length > 0) {
      return block.items.filter(item => selectedItems.includes(item.id));
    }
    if (selectedMateria) {
      return [selectedMateria];
    }
    return [];
  };

  // Clipboard functionality
  const { hasCopiedMaterias } = useMateriaClipboard({
    selectedMaterias: getSelectedMaterias(),
    onPasteMaterias,
    currentBlockId: block.id,
    currentTelejornalId,
    isEnabled: isEspelhoOpen && canModify,
    selectedMateria
  });

  const handleToggleClipboardSelection = (materia: Materia) => {
    setClipboardSelectedMaterias(prev => {
      const isAlreadySelected = prev.some(m => m.id === materia.id);
      if (isAlreadySelected) {
        return prev.filter(m => m.id !== materia.id);
      } else {
        return [...prev, materia];
      }
    });
    
    // Also set as the current selected materia for paste operations
    setSelectedMateria(materia);
  };

  const isClipboardSelected = (materia: Materia) => {
    return clipboardSelectedMaterias.some(m => m.id === materia.id);
  };

  const handleDeleteSelected = () => {
    // Get the actual materia objects for selected IDs
    const materiasToDelete = block.items.filter(item => selectedItems.includes(item.id));
    
    // Call the batch delete function
    onBatchDeleteItems(materiasToDelete);
    
    // Clear selection after deletion
    setSelectedItems(new Set());
  };

  const handleCancelBatch = () => {
    toggleBatchMode();
    clearSelection();
  };
  
  return (
    <div 
      key={block.id} 
      data-block-id={block.id}
      className="border border-gray-200 rounded-lg shadow-sm"
    >
      <BlockHeader
        blockName={block.nome}
        totalTime={block.totalTime}
        onAddItem={() => onAddItem(block.id)}
        newItemBlock={newItemBlock}
        blockId={block.id}
        isEspelhoOpen={isEspelhoOpen}
        canAddItem={canModify}
        onRenameBlock={onRenameBlock}
        onDeleteBlock={onDeleteBlock}
        // Batch selection props
        isBatchMode={isBatchMode}
        onToggleBatchMode={toggleBatchMode}
        selectedCount={selectedCount}
        allSelected={allSelected}
        onSelectAll={selectAll}
        onClearSelection={clearSelection}
        onDeleteSelected={handleDeleteSelected}
        onCancelBatch={handleCancelBatch}
        isDeleting={isDeleting}
        // Clipboard props
        clipboardSelectedCount={clipboardSelectedMaterias.length}
        hasCopiedMaterias={hasCopiedMaterias}
      />
      <BlockContent
        blockId={block.id}
        items={block.items}
        onEditItem={onEditItem}
        onDeleteItem={onDeleteItem}
        onDuplicateItem={onDuplicateItem}
        isEspelhoOpen={isEspelhoOpen}
        canModifyItems={canModify}
        // Batch selection props
        isBatchMode={isBatchMode}
        isSelected={isSelected}
        onToggleSelection={toggleItemSelection}
        // Clipboard selection props
        isClipboardSelected={isClipboardSelected}
        onToggleClipboardSelection={handleToggleClipboardSelection}
      />
    </div>
  );
};
