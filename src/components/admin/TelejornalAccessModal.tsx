import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  fetchTelejornalAccess,
  createTelejornalAccess,
  updateTelejornalAccess,
  deleteTelejornalAccess,
  TelejornalAccessWithDetails,
} from "@/services/telejornal-access-api";
import { TelejornalAccessTable } from "./TelejornalAccessTable";
import { TelejornalAccessForm, TelejornalAccessFormData } from "./TelejornalAccessForm";

interface TelejornalAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TelejornalAccessModal = ({
  open,
  onOpenChange,
}: TelejornalAccessModalProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editingAccess, setEditingAccess] = useState<TelejornalAccessWithDetails | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accessList, isLoading } = useQuery({
    queryKey: ["telejornal-access"],
    queryFn: fetchTelejornalAccess,
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: createTelejornalAccess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telejornal-access"] });
      toast({
        title: "Sucesso",
        description: "Exceção de permissão criada com sucesso.",
      });
      setShowForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar exceção de permissão.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TelejornalAccessFormData> }) =>
      updateTelejornalAccess(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telejornal-access"] });
      toast({
        title: "Sucesso",
        description: "Permissão atualizada com sucesso.",
      });
      setEditingAccess(null);
      setShowForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar permissão.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTelejornalAccess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telejornal-access"] });
      toast({
        title: "Sucesso",
        description: "Exceção de permissão removida com sucesso.",
      });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover exceção de permissão.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: TelejornalAccessFormData) => {
    if (editingAccess) {
      updateMutation.mutate({ id: editingAccess.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (access: TelejornalAccessWithDetails) => {
    setEditingAccess(access);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAccess(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Permissões por Telejornal</DialogTitle>
            <DialogDescription>
              Gerencie exceções de permissão específicas por telejornal. Usuários terão a permissão
              definida aqui apenas para o telejornal selecionado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!showForm && (
              <div className="flex justify-end">
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Exceção
                </Button>
              </div>
            )}

            {showForm ? (
              <TelejornalAccessForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                initialData={editingAccess || undefined}
                isLoading={createMutation.isPending || updateMutation.isPending}
              />
            ) : (
              <>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </div>
                ) : (
                  <TelejornalAccessTable
                    data={accessList || []}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta exceção de permissão? O usuário voltará a ter
              apenas sua permissão global neste telejornal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
