
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Check, X, Copy, Square, CheckSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { formatTime } from "./utils";

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
  onCopySelected?: () => void;
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
  onCopySelected,
  onCancelBatch,
  isDeleting = false
}: BlockHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(blockName);

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
    <div className="bg-gray-50 border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={handleKeyPress}
                className="text-lg font-semibold h-8 min-w-[200px]"
                autoFocus
              />
              <Button size="sm" onClick={handleSaveEdit}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-800">{blockName}</h3>
              {isEspelhoOpen && canAddItem && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
          <span className="text-sm text-gray-600">
            Tempo total: {formatTime(totalTime)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Batch mode controls */}
          {isBatchMode && (
            <>
              <div className="flex items-center gap-2 mr-4">
                <span className="text-sm text-gray-600">
                  {selectedCount} selecionada(s)
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={allSelected ? onClearSelection : onSelectAll}
                >
                  {allSelected ? <Square className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}
                  {allSelected ? "Desmarcar todas" : "Selecionar todas"}
                </Button>
              </div>

              {selectedCount > 0 && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onCopySelected}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar ({selectedCount})
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-800"
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir ({selectedCount})
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza de que deseja excluir {selectedCount} matéria(s) selecionada(s)?
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={onDeleteSelected}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={onCancelBatch}
              >
                Cancelar
              </Button>
            </>
          )}

          {/* Regular controls */}
          {!isBatchMode && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={onToggleBatchMode}
                disabled={!isEspelhoOpen || !canAddItem}
              >
                Selecionar múltiplas
              </Button>
              
              <Button
                size="sm"
                onClick={onAddItem}
                disabled={newItemBlock === blockId || !isEspelhoOpen || !canAddItem}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Adicionar Matéria
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-800"
                    disabled={!isEspelhoOpen || !canAddItem}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão do bloco</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza de que deseja excluir o bloco "{blockName}" e todas as suas matérias?
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDeleteBlock(blockId)}>
                      Excluir Bloco
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
