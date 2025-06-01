
import { Button } from "@/components/ui/button";
import { Trash2, CheckSquare, Square, X } from "lucide-react";
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

interface BatchActionsProps {
  selectedCount: number;
  allSelected: boolean;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export const BatchActions = ({
  selectedCount,
  allSelected,
  onSelectAll,
  onClearSelection,
  onDeleteSelected,
  onCancel,
  isDeleting = false
}: BatchActionsProps) => {
  return (
    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-md p-2">
      <span className="text-sm text-blue-700 font-medium">
        {selectedCount} selecionada{selectedCount !== 1 ? 's' : ''}
      </span>
      
      <Button
        size="sm"
        variant="ghost"
        onClick={allSelected ? onClearSelection : onSelectAll}
        className="h-8"
        disabled={isDeleting}
      >
        {allSelected ? (
          <>
            <Square className="h-4 w-4 mr-1" />
            Limpar
          </>
        ) : (
          <>
            <CheckSquare className="h-4 w-4 mr-1" />
            Selecionar Todas
          </>
        )}
      </Button>

      {selectedCount > 0 && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-red-600 hover:text-red-800"
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {isDeleting ? "Excluindo..." : "Excluir Selecionadas"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão em Lote</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir {selectedCount} matéria{selectedCount !== 1 ? 's' : ''} selecionada{selectedCount !== 1 ? 's' : ''}? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-red-600 hover:bg-red-700"
                onClick={onDeleteSelected}
                disabled={isDeleting}
              >
                {isDeleting ? "Excluindo..." : `Excluir ${selectedCount} Matéria${selectedCount !== 1 ? 's' : ''}`}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <Button
        size="sm"
        variant="ghost"
        onClick={onCancel}
        className="h-8 ml-auto"
        disabled={isDeleting}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
