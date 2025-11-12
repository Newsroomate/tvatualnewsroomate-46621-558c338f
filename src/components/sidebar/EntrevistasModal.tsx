// Modal de Entrevistas com funcionalidade de edição
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  fetchEntrevistasByTelejornal,
  createEntrevista,
  updateEntrevista,
  deleteEntrevista,
  Entrevista,
} from "@/services/entrevistas-api";

interface EntrevistasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  telejornalId: string;
  telejornalNome: string;
}

export const EntrevistasModal = ({
  open,
  onOpenChange,
  telejornalId,
  telejornalNome,
}: EntrevistasModalProps) => {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEntrevista, setNewEntrevista] = useState({
    titulo: "",
    entrevistado: "",
    descricao: "",
    local: "",
    horario: "",
    data_entrevista: "",
  });
  const [editEntrevista, setEditEntrevista] = useState({
    titulo: "",
    entrevistado: "",
    descricao: "",
    local: "",
    horario: "",
    data_entrevista: "",
  });

  const { data: entrevistas, isLoading } = useQuery({
    queryKey: ["entrevistas", telejornalId],
    queryFn: () => fetchEntrevistasByTelejornal(telejornalId),
    enabled: open && !!telejornalId,
  });

  const createMutation = useMutation({
    mutationFn: createEntrevista,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entrevistas", telejornalId] });
      toast.success("Entrevista criada com sucesso!");
      setIsAdding(false);
      setNewEntrevista({
        titulo: "",
        entrevistado: "",
        descricao: "",
        local: "",
        horario: "",
        data_entrevista: "",
      });
    },
    onError: () => {
      toast.error("Erro ao criar entrevista");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Entrevista> }) =>
      updateEntrevista(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entrevistas", telejornalId] });
      toast.success("Entrevista atualizada com sucesso!");
      setEditingId(null);
    },
    onError: () => {
      toast.error("Erro ao atualizar entrevista");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEntrevista,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entrevistas", telejornalId] });
      toast.success("Entrevista excluída com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao excluir entrevista");
    },
  });

  const handleCreate = () => {
    if (!newEntrevista.titulo.trim() || !newEntrevista.entrevistado.trim()) {
      toast.error("Título e entrevistado são obrigatórios");
      return;
    }

    createMutation.mutate({
      telejornal_id: telejornalId,
      ...newEntrevista,
      status: "agendada",
    });
  };

  const handleEdit = (entrevista: Entrevista) => {
    setEditingId(entrevista.id);
    setEditEntrevista({
      titulo: entrevista.titulo || "",
      entrevistado: entrevista.entrevistado || "",
      descricao: entrevista.descricao || "",
      local: entrevista.local || "",
      horario: entrevista.horario || "",
      data_entrevista: entrevista.data_entrevista || "",
    });
    setIsAdding(false);
  };

  const handleUpdate = () => {
    if (!editEntrevista.titulo.trim() || !editEntrevista.entrevistado.trim()) {
      toast.error("Título e entrevistado são obrigatórios");
      return;
    }

    updateMutation.mutate({
      id: editingId!,
      updates: editEntrevista,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditEntrevista({
      titulo: "",
      entrevistado: "",
      descricao: "",
      local: "",
      horario: "",
      data_entrevista: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Entrevistas - {telejornalNome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Lista de Entrevistas</h3>
            <Button
              size="sm"
              onClick={() => setIsAdding(!isAdding)}
              variant={isAdding ? "secondary" : "default"}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              {isAdding ? "Cancelar" : "Nova Entrevista"}
            </Button>
          </div>

          {isAdding && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
              <div>
                <Label htmlFor="titulo">Título*</Label>
                <Input
                  id="titulo"
                  value={newEntrevista.titulo}
                  onChange={(e) =>
                    setNewEntrevista({ ...newEntrevista, titulo: e.target.value })
                  }
                  placeholder="Digite o título da entrevista"
                />
              </div>

              <div>
                <Label htmlFor="entrevistado">Entrevistado*</Label>
                <Input
                  id="entrevistado"
                  value={newEntrevista.entrevistado}
                  onChange={(e) =>
                    setNewEntrevista({ ...newEntrevista, entrevistado: e.target.value })
                  }
                  placeholder="Nome do entrevistado"
                />
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={newEntrevista.descricao}
                  onChange={(e) =>
                    setNewEntrevista({ ...newEntrevista, descricao: e.target.value })
                  }
                  placeholder="Descrição da entrevista"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="local">Local</Label>
                  <Input
                    id="local"
                    value={newEntrevista.local}
                    onChange={(e) =>
                      setNewEntrevista({ ...newEntrevista, local: e.target.value })
                    }
                    placeholder="Local da entrevista"
                  />
                </div>

                <div>
                  <Label htmlFor="horario">Horário</Label>
                  <Input
                    id="horario"
                    value={newEntrevista.horario}
                    onChange={(e) =>
                      setNewEntrevista({ ...newEntrevista, horario: e.target.value })
                    }
                    placeholder="Ex: 14:00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="data_entrevista">Data da Entrevista</Label>
                <Input
                  id="data_entrevista"
                  type="date"
                  value={newEntrevista.data_entrevista}
                  onChange={(e) =>
                    setNewEntrevista({ ...newEntrevista, data_entrevista: e.target.value })
                  }
                />
              </div>

              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="w-full"
              >
                Criar Entrevista
              </Button>
            </div>
          )}

          <div className="space-y-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : entrevistas && entrevistas.length > 0 ? (
              entrevistas.map((entrevista) => (
                <div key={entrevista.id}>
                  {editingId === entrevista.id ? (
                    <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
                      <div>
                        <Label>Título*</Label>
                        <Input
                          value={editEntrevista.titulo}
                          onChange={(e) =>
                            setEditEntrevista({ ...editEntrevista, titulo: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label>Entrevistado*</Label>
                        <Input
                          value={editEntrevista.entrevistado}
                          onChange={(e) =>
                            setEditEntrevista({ ...editEntrevista, entrevistado: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label>Descrição</Label>
                        <Textarea
                          value={editEntrevista.descricao}
                          onChange={(e) =>
                            setEditEntrevista({ ...editEntrevista, descricao: e.target.value })
                          }
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Local</Label>
                          <Input
                            value={editEntrevista.local}
                            onChange={(e) =>
                              setEditEntrevista({ ...editEntrevista, local: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label>Horário</Label>
                          <Input
                            value={editEntrevista.horario}
                            onChange={(e) =>
                              setEditEntrevista({ ...editEntrevista, horario: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Data da Entrevista</Label>
                        <Input
                          type="date"
                          value={editEntrevista.data_entrevista}
                          onChange={(e) =>
                            setEditEntrevista({ ...editEntrevista, data_entrevista: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleUpdate}
                          disabled={updateMutation.isPending}
                          className="flex-1"
                        >
                          Salvar
                        </Button>
                        <Button
                          onClick={handleCancelEdit}
                          variant="outline"
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-3 flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{entrevista.titulo}</h4>
                        <p className="text-sm font-semibold text-primary mt-1">
                          {entrevista.entrevistado}
                        </p>
                        {entrevista.descricao && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {entrevista.descricao}
                          </p>
                        )}
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          {entrevista.local && <span>Local: {entrevista.local}</span>}
                          {entrevista.horario && <span>Horário: {entrevista.horario}</span>}
                          {entrevista.data_entrevista && (
                            <span>Data: {new Date(entrevista.data_entrevista).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(entrevista)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMutation.mutate(entrevista.id)}
                          disabled={deleteMutation.isPending}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma entrevista cadastrada
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
