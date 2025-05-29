
import { useState } from "react";
import { BlockHeaderTitle } from "./BlockHeaderTitle";
import { BlockHeaderActions } from "./BlockHeaderActions";
import { BlockHeaderDeleteDialog } from "./BlockHeaderDeleteDialog";

interface BlockHeaderProps {
  blockName: string;
  totalTime: number;
  onAddItem: () => void;
  newItemBlock: string | null;
  blockId: string;
  isEspelhoOpen: boolean;
  canAddItem?: boolean;
  onRenameBlock: (blockId: string, newName: string) => void;
  onDeleteBlock: (blockId: string) => void;
}

export const BlockHeader = ({ 
  blockName, 
  totalTime, 
  onAddItem, 
  newItemBlock, 
  blockId,
  isEspelhoOpen,
  canAddItem = true,
  onRenameBlock,
  onDeleteBlock
}: BlockHeaderProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteClick = () => {
    if (!isEspelhoOpen || !canAddItem) return;
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    onDeleteBlock(blockId);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="bg-muted p-3 rounded-t-lg flex justify-between items-center">
        <BlockHeaderTitle
          blockName={blockName}
          blockId={blockId}
          isEspelhoOpen={isEspelhoOpen}
          canAddItem={canAddItem}
          onRenameBlock={onRenameBlock}
        />
        
        <BlockHeaderActions
          totalTime={totalTime}
          onAddItem={onAddItem}
          onDeleteClick={handleDeleteClick}
          newItemBlock={newItemBlock}
          blockId={blockId}
          isEspelhoOpen={isEspelhoOpen}
          canAddItem={canAddItem}
        />
      </div>

      <BlockHeaderDeleteDialog
        showDeleteDialog={showDeleteDialog}
        setShowDeleteDialog={setShowDeleteDialog}
        blockName={blockName}
        onConfirmDelete={handleConfirmDelete}
      />
    </>
  );
};
