
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Check, 
  X,
  CheckSquare,
  Square,
  Copy,
  Clipboard
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
  // Clipboard props
  clipboardSelectedCount?: number;
  hasCopiedMaterias?: boolean;
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
  onSelectAll,
  onClearSelection,
  onDeleteSelected,
  onCancelBatch,
  isDeleting = false,
  // Clipboard props
  clipboardSelectedCount = 0,
  hasCopiedMaterias = false
}: BlockHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(blockName);

  const handleSaveName = () => {
    if (editName.trim() && editName !== blockName) {
      onRenameBlock(blockId, editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(blockName);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="bg-gray-50 px-4 py-3 border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleKeyPress}
                className="h-8 w-48"
                autoFocus
              />
              <Button size="sm" variant="ghost" onClick={handleSaveName}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <h3 className="font-semibold text-lg">{blockName}</h3>
              <Badge variant="secondary" className="text-xs">
                {formatTime(totalTime)}
              </Badge>
              
              {/* Clipboard indicators */}
              {clipboardSelectedCount > 0 && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  <Copy className="h-3 w-3 mr-1" />
                  {clipboardSelectedCount} selecionada(s)
                </Badge>
              )}
              
              {hasCopiedMaterias && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  <Clipboard className="h-3 w-3 mr-1" />
                  Ctrl+V para colar
                </Badge>
              )}
            </>
          )}
        </div>

        <div className="flex items-center space-x-2">
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
            <>
              <Button
                size="sm"
                onClick={onAddItem}
                disabled={!isEspelhoOpen || !canAddItem || newItemBlock === blockId}
                className="flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Nova Matéria</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Renomear Bloco
                  </DropdownMenuItem>
                  
                  {onToggleBatchMode && (
                    <DropdownMenuItem 
                      onClick={onToggleBatchMode}
                      disabled={!isEspelhoOpen}
                    >
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Seleção em Lote
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={() => onDeleteBlock(blockId)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Bloco
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
      
      {/* Instructions for clipboard usage */}
      {!isBatchMode && isEspelhoOpen && (
        <div className="mt-2 text-xs text-gray-500">
          Dica: Use Ctrl+Click para selecionar matérias, Ctrl+C para copiar e Ctrl+V para colar
        </div>
      )}
    </div>
  );
};
