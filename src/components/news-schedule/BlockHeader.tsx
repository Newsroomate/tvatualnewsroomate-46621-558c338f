
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PlusCircle, Edit2, Trash2, Check, X, Users, Loader2 } from "lucide-react";
import { formatTime } from "./utils";
import { BatchActions } from "./BatchActions";

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
  // Batch selection props
  isBatchMode?: boolean;
  onToggleBatchMode?: () => void;
  selectedCount?: number;
  allSelected?: boolean;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onDeleteSelected?: () => void;
  onCancelBatch?: () => void;
  isDeleting?: boolean;
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
  onDeleteBlock,
  // Batch selection props
  isBatchMode = false,
  onToggleBatchMode,
  selectedCount = 0,
  allSelected = false,
  onSelectAll = () => {},
  onClearSelection = () => {},
  onDeleteSelected = () => {},
  onCancelBatch = () => {},
  isDeleting = false
}: BlockHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(blockName);

  const handleStartEdit = () => {
    setEditedName(blockName);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editedName.trim() && editedName !== blockName) {
      onRenameBlock(blockId, editedName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedName(blockName);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="bg-gray-50 p-3 border-b border-gray-200">
      {isBatchMode ? (
        <BatchActions
          selectedCount={selectedCount}
          allSelected={allSelected}
          onSelectAll={onSelectAll}
          onClearSelection={onClearSelection}
          onDeleteSelected={onDeleteSelected}
          onCancel={onCancelBatch}
          isDeleting={isDeleting}
        />
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="h-8 text-sm font-medium"
                  autoFocus
                  onBlur={handleSaveEdit}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSaveEdit}
                  className="h-6 w-6 p-0"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-medium">{blockName}</h3>
                {isEspelhoOpen && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleStartEdit}
                    className="h-6 w-6 p-0"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                )}
              </>
            )}
            <Badge variant="outline">
              {formatTime(totalTime)}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Only show batch mode toggle if user can delete */}
            {isEspelhoOpen && onToggleBatchMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleBatchMode}
                className="h-8"
                title="Modo seleção em lote"
              >
                <Users className="h-4 w-4" />
              </Button>
            )}
            
            {isEspelhoOpen && canAddItem && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onAddItem}
                disabled={newItemBlock === blockId}
                className="h-8"
              >
                {newItemBlock === blockId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="h-4 w-4" />
                )}
              </Button>
            )}
            
            {isEspelhoOpen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteBlock(blockId)}
                className="h-8 text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
