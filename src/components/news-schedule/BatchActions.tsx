
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Square, CheckSquare, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

interface BatchActionsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  isEnabled: boolean;
}

export const BatchActions = ({
  isOpen,
  onOpenChange,
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onDeleteSelected,
  isEnabled
}: BatchActionsProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
    onOpenChange(false);
  };

  const handleConfirmDelete = () => {
    onDeleteSelected();
    setShowDeleteDialog(false);
  };

  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <>
      <Popover open={isOpen} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            disabled={!isEnabled || totalCount === 0}
            className="h-8"
          >
            <CheckSquare className="h-4 w-4 mr-1" />
            Ações em Lote
            {selectedCount > 0 && (
              <span className="ml-1 bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs">
                {selectedCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="end">
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 mb-2">
              {selectedCount} de {totalCount} selecionadas
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={allSelected ? onClearSelection : onSelectAll}
              className="w-full justify-start h-8"
            >
              {allSelected ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Desmarcar Todas
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Selecionar Todas
                </>
              )}
            </Button>

            {selectedCount > 0 && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClearSelection}
                  className="w-full justify-start h-8"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar Seleção
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDeleteClick}
                  className="w-full justify-start h-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Selecionadas
                </Button>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão em Lote</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selectedCount} matéria{selectedCount !== 1 ? 's' : ''}? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={handleConfirmDelete}
            >
              Excluir {selectedCount} Matéria{selectedCount !== 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
