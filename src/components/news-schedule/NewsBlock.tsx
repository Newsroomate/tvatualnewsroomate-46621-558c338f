
import { Bloco, Materia } from "@/types";
import { BlockHeader } from "./BlockHeader";
import { BlockContent } from "./BlockContent";
import { useAuth } from "@/context/AuthContext";
import { canModifyMaterias } from "@/utils/permission";
import { useBatchSelection } from "@/hooks/useBatchSelection";
import { useItemSelection } from "@/hooks/useItemSelection";

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
  selectedMateria?: Materia | null;
  onMateriaSelect?: (materia: Materia | null) => void;
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
  selectedMateria,
  onMateriaSelect
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

  // Visual selection functionality
  const {
    selectedMateria: localSelectedMateria,
    selectedItemId,
    selectItem,
    clearSelection: clearVisualSelection,
    isSelected: isVisuallySelected
  } = useItemSelection();

  // Use external selected materia if provided, otherwise use local
  const currentSelectedMateria = selectedMateria || localSelectedMateria;
  const currentSelectedItemId = selectedMateria?.id || selectedItemId;

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

  const handleItemClick = (materia: Materia) => {
    // If the item is already selected, deselect it
    if (currentSelectedMateria?.id === materia.id) {
      if (onMateriaSelect) {
        onMateriaSelect(null);
      } else {
        clearVisualSelection();
      }
    } else {
      if (onMateriaSelect) {
        onMateriaSelect(materia);
      } else {
        selectItem(materia);
      }
    }
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
        // Visual selection props
        selectedItemId={currentSelectedItemId}
        onItemClick={handleItemClick}
      />
    </div>
  );
};
