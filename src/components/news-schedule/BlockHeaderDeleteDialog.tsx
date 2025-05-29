
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

interface BlockHeaderDeleteDialogProps {
  showDeleteDialog: boolean;
  setShowDeleteDialog: (show: boolean) => void;
  blockName: string;
  onConfirmDelete: () => void;
}

export const BlockHeaderDeleteDialog = ({
  showDeleteDialog,
  setShowDeleteDialog,
  blockName,
  onConfirmDelete
}: BlockHeaderDeleteDialogProps) => {
  return (
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
            onClick={onConfirmDelete}
          >
            Excluir Bloco
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
