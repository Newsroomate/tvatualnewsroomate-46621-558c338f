
import { Bloco, Materia } from "@/types";
import { BlockHeader } from "./BlockHeader";
import { BlockContent } from "./BlockContent";
import { useAuth } from "@/context/AuthContext";
import { canModifyMaterias } from "@/utils/permission";
import { useBatchSelection } from "@/hooks/useBatchSelection";

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
  onBatchDelete?: (items: Materia[]) => void;
  journalPrefix?: string;
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
  onBatchDelete,
  journalPrefix = "default"
}: NewsBlockProps) => {
  const { profile } = useAuth();
  const canModify = canModifyMaterias(profile);
  
  const {
    selectedCount,
    totalCount,
    isBatchMode,
    toggleBatchMode,
    selectAll,
    clearSelection,
    isSelected,
    toggleItemSelection,
    getSelectedItems
  } = useBatchSelection({ items: block.items });

  const handleBatchDelete = () => {
    const selectedItems = getSelectedItems();
    if (onBatchDelete) {
      onBatchDelete(selectedItems);
    } else {
      // Fallback to individual deletions
      selectedItems.forEach(item => onDeleteItem(item));
    }
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
        isBatchMode={isBatchMode}
        onToggleBatchMode={toggleBatchMode}
        selectedCount={selectedCount}
        totalCount={totalCount}
        onSelectAll={selectAll}
        onClearSelection={clearSelection}
        onDeleteSelected={handleBatchDelete}
      />
      <BlockContent
        blockId={block.id}
        items={block.items}
        onEditItem={onEditItem}
        onDeleteItem={onDeleteItem}
        onDuplicateItem={onDuplicateItem}
        isEspelhoOpen={isEspelhoOpen}
        canModifyItems={canModify}
        selectedIds={new Set([...Array.from({ length: selectedCount }, (_, i) => getSelectedItems()[i]?.id)].filter(Boolean))}
        onToggleSelection={toggleItemSelection}
        batchModeEnabled={isBatchMode}
        isSelected={isSelected}
      />
    </div>
  );
};
