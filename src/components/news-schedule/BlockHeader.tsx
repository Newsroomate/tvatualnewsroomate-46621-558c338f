import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckSquare,
  Loader2,
  MoreVertical,
  Plus,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { formatTime } from "./utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  onSelectAll,
  onClearSelection,
  onDeleteSelected,
  onCancelBatch,
  isDeleting = false
}: BlockHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newBlockName, setNewBlockName] = useState(blockName);

  const handleRenameBlock = () => {
    if (newBlockName.trim() !== "") {
      onRenameBlock(blockId, newBlockName);
      setIsEditing(false);
    }
  };

  return (
    <div className="p-4 bg-gray-50 border-b">
      {/* Batch actions bar - shown when in batch mode */}
      {isBatchMode && onDeleteSelected && onCancelBatch && onSelectAll && onClearSelection && (
        <div className="mb-3">
          <BatchActions
            selectedCount={selectedCount}
            allSelected={allSelected}
            onSelectAll={onSelectAll}
            onClearSelection={onClearSelection}
            onDeleteSelected={onDeleteSelected}
            onCancel={onCancelBatch}
            isDeleting={isDeleting}
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        {/* Block name and time display */}
        <div className="flex items-center gap-4">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={newBlockName}
                onChange={(e) => setNewBlockName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRenameBlock();
                  }
                }}
              />
              <Button size="sm" onClick={handleRenameBlock}>
                Salvar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{blockName}</h3>
              <span className="text-sm text-gray-500">
                {formatTime(totalTime)}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Batch mode toggle button */}
          {onToggleBatchMode && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onToggleBatchMode}
              className="h-8"
              disabled={!isEspelhoOpen || !canAddItem || isDeleting}
            >
              <CheckSquare className="h-4 w-4 mr-1" />
              {isBatchMode ? "Sair do Modo Lote" : "Seleção em Lote"}
            </Button>
          )}

          {/* Add item button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={onAddItem}
            disabled={!isEspelhoOpen || !canAddItem || newItemBlock === blockId || isBatchMode}
            className="h-8"
          >
            {newItemBlock === blockId ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Plus className="h-4 w-4 mr-1" />
            )}
            {newItemBlock === blockId ? "Criando..." : "Adicionar"}
          </Button>

          {/* Block options menu */}
          {!isBatchMode && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Abrir menu</span>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setIsEditing(true)} disabled={!isEspelhoOpen}>
                  Renomear
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem className="text-red-600 hover:text-red-800" disabled={!isEspelhoOpen}>
                      Excluir Bloco
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir este bloco? Esta ação não pode ser
                        desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => onDeleteBlock(blockId)}
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
};
