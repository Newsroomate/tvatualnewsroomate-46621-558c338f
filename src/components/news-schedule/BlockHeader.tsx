
import { Button } from "@/components/ui/button";
import { PlusCircle, Pencil, Trash2, Check, X, CheckSquare } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  onCancelBatch
}: BlockHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(blockName);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  const handleDeleteClick = () => {
    if (!isEspelhoOpen || !canAddItem) return;
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    onDeleteBlock(blockId);
    setShowDeleteDialog(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <>
      <div className="bg-muted p-3 rounded-t-lg">
        {/* Batch Actions Mode */}
        {isBatchMode && onSelectAll && onClearSelection && onDeleteSelected && onCancelBatch && (
          <div className="mb-3">
            <BatchActions
              selectedCount={selectedCount}
              allSelected={allSelected}
              onSelectAll={onSelectAll}
              onClearSelection={onClearSelection}
              onDeleteSelected={onDeleteSelected}
              onCancel={onCancelBatch}
            />
          </div>
        )}

        {/* Normal Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {isEditing ? (
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
            ) : (
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
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleDeleteClick}
                        disabled={!isEspelhoOpen || !canAddItem}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    {!isEspelhoOpen && (
                      <TooltipContent>
                        Abra o espelho para excluir
                      </TooltipContent>
                    )}
                    {!canAddItem && isEspelhoOpen && (
                      <TooltipContent>
                        Sem permissão para excluir
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">
              Tempo: {formatTime(totalTime)}
            </span>
            
            {/* Batch Actions Toggle Button */}
            {onToggleBatchMode && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="sm" 
                      variant={isBatchMode ? "default" : "ghost"}
                      onClick={onToggleBatchMode}
                      disabled={!isEspelhoOpen || !canAddItem}
                      className="h-8"
                    >
                      <CheckSquare className="h-4 w-4 mr-1" />
                      {isBatchMode ? "Sair" : "Ações em Lote"}
                    </Button>
                  </TooltipTrigger>
                  {!isEspelhoOpen && (
                    <TooltipContent>
                      Abra o espelho para ações em lote
                    </TooltipContent>
                  )}
                  {!canAddItem && isEspelhoOpen && (
                    <TooltipContent>
                      Sem permissão para ações em lote
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={onAddItem}
                      disabled={(newItemBlock === blockId || !isEspelhoOpen || !canAddItem)}
                    >
                      <PlusCircle className="h-4 w-4 mr-1" /> Nova Matéria
                    </Button>
                  </div>
                </TooltipTrigger>
                {!isEspelhoOpen && (
                  <TooltipContent>
                    Abra o espelho para adicionar matérias
                  </TooltipContent>
                )}
                {!canAddItem && isEspelhoOpen && (
                  <TooltipContent>
                    Sem permissão para adicionar matérias
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão do Bloco</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o bloco "{blockName}"? Todas as matérias dentro deste bloco também serão excluídas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={handleConfirmDelete}
            >
              Excluir Bloco
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
