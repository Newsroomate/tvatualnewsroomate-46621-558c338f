
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, Pencil } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BlockHeaderTitleProps {
  blockName: string;
  blockId: string;
  isEspelhoOpen: boolean;
  canAddItem: boolean;
  onRenameBlock: (blockId: string, newName: string) => void;
}

export const BlockHeaderTitle = ({
  blockName,
  blockId,
  isEspelhoOpen,
  canAddItem,
  onRenameBlock
}: BlockHeaderTitleProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(blockName);

  const handleStartEdit = () => {
    if (!isEspelhoOpen || !canAddItem) return;
    setIsEditing(true);
    setEditingName(blockName);
  };

  const handleSaveEdit = () => {
    if (editingName.trim() && editingName !== blockName) {
      onRenameBlock(blockId, editingName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingName(blockName);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          value={editingName}
          onChange={(e) => setEditingName(e.target.value)}
          onKeyDown={handleKeyPress}
          className="h-8 text-sm font-bold"
          autoFocus
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSaveEdit}
          className="h-8 w-8 p-0"
        >
          <Check className="h-4 w-4 text-green-600" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancelEdit}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <h2 className="font-bold">{blockName}</h2>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleStartEdit}
              disabled={!isEspelhoOpen || !canAddItem}
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          {!isEspelhoOpen && (
            <TooltipContent>
              Abra o espelho para renomear
            </TooltipContent>
          )}
          {!canAddItem && isEspelhoOpen && (
            <TooltipContent>
              Sem permissão para renomear
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
