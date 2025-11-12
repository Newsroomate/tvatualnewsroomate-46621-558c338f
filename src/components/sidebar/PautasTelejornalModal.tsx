// Modal de Pautas com funcionalidade de edição
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
import { AutoTextarea } from "@/components/ui/auto-textarea";
import { PlusCircle, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  fetchPautasByTelejornal,
  createPautaTelejornal,
  updatePautaTelejornal,
  deletePautaTelejornal,
} from "@/services/pautas-telejornal-api";
import { useAuth } from "@/context/AuthContext";

interface PautasTelejornalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  telejornalId: string;
  telejornalNome: string;
}

export const PautasTelejornalModal = ({
  open,
  onOpenChange,
  telejornalId,
  telejornalNome,
}: PautasTelejornalModalProps) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPauta, setNewPauta] = useState({
    titulo: "",
    descricao: "",
    local: "",
    horario: "",
    entrevistado: "",
    produtor: "",
    data_cobertura: "",
  });
  const [editPauta, setEditPauta] = useState({
    titulo: "",
    descricao: "",
    local: "",
    horario: "",
    entrevistado: "",
    produtor: "",
    data_cobertura: "",
  });

  const { data: pautas, isLoading } = useQuery({
    queryKey: ["pautas_telejornal", telejornalId],
    queryFn: () => fetchPautasByTelejornal(telejornalId),
    enabled: open && !!telejornalId,
  });

  const createMutation = useMutation({
    mutationFn: ({ pautaData, userId }: { pautaData: any; userId: string }) =>
      createPautaTelejornal(pautaData, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pautas_telejornal", telejornalId] });
      toast.success("Pauta criada com sucesso!");
      setIsAdding(false);
      setNewPauta({
        titulo: "",
        descricao: "",
        local: "",
        horario: "",
        entrevistado: "",
        produtor: "",
        data_cobertura: "",
      });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erro ao criar pauta");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      updatePautaTelejornal(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pautas_telejornal", telejornalId] });
      toast.success("Pauta atualizada com sucesso!");
      setEditingId(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erro ao atualizar pauta");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePautaTelejornal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pautas_telejornal", telejornalId] });
      toast.success("Pauta excluída com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao excluir pauta");
    },
  });

  const handleCreate = () => {
    if (!newPauta.titulo.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    if (!user?.id) {
      toast.error("Você precisa estar logado para criar uma pauta");
      return;
    }

    const pautaData = {
      ...newPauta,
      telejornal_id: telejornalId,
      status: "pendente",
    };

    createMutation.mutate({ pautaData, userId: user.id });
  };

  const handleEdit = (pauta: any) => {
    setEditingId(pauta.id);
    setEditPauta({
      titulo: pauta.titulo || "",
      descricao: pauta.descricao || "",
      local: pauta.local || "",
      horario: pauta.horario || "",
      entrevistado: pauta.entrevistado || "",
      produtor: pauta.produtor || "",
      data_cobertura: pauta.data_cobertura || "",
    });
    setIsAdding(false);
  };

  const handleUpdate = () => {
    if (!editPauta.titulo.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    updateMutation.mutate({
      id: editingId!,
      updates: editPauta,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditPauta({
      titulo: "",
      descricao: "",
      local: "",
      horario: "",
      entrevistado: "",
      produtor: "",
      data_cobertura: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pautas - {telejornalNome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Lista de Pautas</h3>
            <Button
              size="sm"
              onClick={() => setIsAdding(!isAdding)}
              variant={isAdding ? "secondary" : "default"}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              {isAdding ? "Cancelar" : "Nova Pauta"}
            </Button>
          </div>

          {isAdding && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
              <div>
                <Label htmlFor="titulo">Título/Retranca*</Label>
                <Input
                  id="titulo"
                  value={newPauta.titulo}
                  onChange={(e) =>
                    setNewPauta({ ...newPauta, titulo: e.target.value })
                  }
                  placeholder="Digite o título da pauta"
                />
              </div>

              <div>
                <Label htmlFor="descricao">Descrição/Roteiro</Label>
                <AutoTextarea
                  id="descricao"
                  value={newPauta.descricao}
                  onChange={(e) =>
                    setNewPauta({ ...newPauta, descricao: e.target.value })
                  }
                  placeholder="Descrição da pauta"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="produtor">Produtor</Label>
                  <Input
                    id="produtor"
                    value={newPauta.produtor}
                    onChange={(e) =>
                      setNewPauta({ ...newPauta, produtor: e.target.value })
                    }
                    placeholder="Nome do produtor"
                  />
                </div>

                <div>
                  <Label htmlFor="entrevistado">Entrevistado</Label>
                  <Input
                    id="entrevistado"
                    value={newPauta.entrevistado}
                    onChange={(e) =>
                      setNewPauta({ ...newPauta, entrevistado: e.target.value })
                    }
                    placeholder="Nome do entrevistado"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="local">Local</Label>
                  <Input
                    id="local"
                    value={newPauta.local}
                    onChange={(e) =>
                      setNewPauta({ ...newPauta, local: e.target.value })
                    }
                    placeholder="Local da cobertura"
                  />
                </div>

                <div>
                  <Label htmlFor="horario">Horário</Label>
                  <Input
                    id="horario"
                    value={newPauta.horario}
                    onChange={(e) =>
                      setNewPauta({ ...newPauta, horario: e.target.value })
                    }
                    placeholder="Ex: 14:00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="data_cobertura">Data da Cobertura</Label>
                <Input
                  id="data_cobertura"
                  type="date"
                  value={newPauta.data_cobertura}
                  onChange={(e) =>
                    setNewPauta({ ...newPauta, data_cobertura: e.target.value })
                  }
                />
              </div>

              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="w-full"
              >
                Criar Pauta
              </Button>
            </div>
          )}

          <div className="space-y-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : pautas && pautas.length > 0 ? (
              pautas.map((pauta) => (
                <div key={pauta.id}>
                  {editingId === pauta.id ? (
                    <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
                      <div>
                        <Label>Título/Retranca*</Label>
                        <Input
                          value={editPauta.titulo}
                          onChange={(e) =>
                            setEditPauta({ ...editPauta, titulo: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label>Descrição/Roteiro</Label>
                        <AutoTextarea
                          value={editPauta.descricao}
                          onChange={(e) =>
                            setEditPauta({ ...editPauta, descricao: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Produtor</Label>
                          <Input
                            value={editPauta.produtor}
                            onChange={(e) =>
                              setEditPauta({ ...editPauta, produtor: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label>Entrevistado</Label>
                          <Input
                            value={editPauta.entrevistado}
                            onChange={(e) =>
                              setEditPauta({ ...editPauta, entrevistado: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Local</Label>
                          <Input
                            value={editPauta.local}
                            onChange={(e) =>
                              setEditPauta({ ...editPauta, local: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label>Horário</Label>
                          <Input
                            value={editPauta.horario}
                            onChange={(e) =>
                              setEditPauta({ ...editPauta, horario: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Data da Cobertura</Label>
                        <Input
                          type="date"
                          value={editPauta.data_cobertura}
                          onChange={(e) =>
                            setEditPauta({ ...editPauta, data_cobertura: e.target.value })
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
                        <h4 className="font-medium">{pauta.titulo}</h4>
                        {pauta.produtor && (
                          <p className="text-sm font-semibold text-primary mt-1">
                            {pauta.produtor}
                          </p>
                        )}
                        {pauta.descricao && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Descrição: {pauta.descricao}
                          </p>
                        )}
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          {pauta.local && <span>Local: {pauta.local}</span>}
                          {pauta.horario && <span>Horário: {pauta.horario}</span>}
                          {pauta.data_cobertura && (
                            <span>Data: {new Date(pauta.data_cobertura).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(pauta)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMutation.mutate(pauta.id)}
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
                Nenhuma pauta cadastrada
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
