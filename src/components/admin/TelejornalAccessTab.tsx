import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchTelejornalAccess,
  deleteTelejornalAccess,
  createTelejornalAccess,
  updateTelejornalAccess,
  TelejornalAccessWithDetails,
} from "@/services/telejornal-access-api";
import { TelejornalAccessTable } from "./TelejornalAccessTable";
import { TelejornalAccessForm, TelejornalAccessFormData } from "./TelejornalAccessForm";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

export function TelejornalAccessTab() {
  const queryClient = useQueryClient();
  const [editingAccess, setEditingAccess] = useState<TelejornalAccessWithDetails | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: accessData, isLoading } = useQuery({
    queryKey: ["telejornal-access"],
    queryFn: fetchTelejornalAccess,
  });

  const createMutation = useMutation({
    mutationFn: (data: TelejornalAccessFormData) => createTelejornalAccess(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telejornal-access"] });
      toast.success("Acesso criado com sucesso");
      setShowForm(false);
      setEditingAccess(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar acesso");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TelejornalAccessFormData> }) =>
      updateTelejornalAccess(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telejornal-access"] });
      toast.success("Acesso atualizado");
      setShowForm(false);
      setEditingAccess(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar acesso");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTelejornalAccess(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telejornal-access"] });
      toast.success("Acesso removido");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover acesso");
    },
  });

  const handleEdit = (access: TelejornalAccessWithDetails) => {
    setEditingAccess(access);
    setShowForm(true);
  };

  const handleSubmit = (data: TelejornalAccessFormData) => {
    if (editingAccess) {
      updateMutation.mutate({ id: editingAccess.id, updates: data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Configure exceções de acesso por telejornal. Usuários com exceções verão APENAS os telejornais listados aqui.
        </div>
        <Button
          onClick={() => {
            setEditingAccess(null);
            setShowForm(true);
          }}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar
        </Button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-4 bg-muted/30">
          <TelejornalAccessForm
            initialData={editingAccess || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingAccess(null);
            }}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </div>
      )}

      <TelejornalAccessTable
        data={accessData || []}
        onEdit={handleEdit}
        onDelete={(id) => deleteMutation.mutate(id)}
      />
    </div>
  );
}
