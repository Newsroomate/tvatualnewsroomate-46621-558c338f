// Modal de Reportagens com funcionalidade de edição
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
  fetchReportagensByTelejornal,
  createReportagem,
  updateReportagem,
  deleteReportagem,
  Reportagem,
} from "@/services/reportagens-api";

interface ReportagensModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  telejornalId: string;
  telejornalNome: string;
}

export const ReportagensModal = ({
  open,
  onOpenChange,
  telejornalId,
  telejornalNome,
}: ReportagensModalProps) => {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newReportagem, setNewReportagem] = useState({
    retranca: "",
    corpo_materia: "",
    reporter: "",
    local: "",
    data_gravacao: "",
  });
  const [editReportagem, setEditReportagem] = useState({
    retranca: "",
    corpo_materia: "",
    reporter: "",
    local: "",
    data_gravacao: "",
  });

  const { data: reportagens, isLoading } = useQuery({
    queryKey: ["reportagens", telejornalId],
    queryFn: () => fetchReportagensByTelejornal(telejornalId),
    enabled: open && !!telejornalId,
  });

  const createMutation = useMutation({
    mutationFn: createReportagem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reportagens", telejornalId] });
      toast.success("Reportagem criada com sucesso!");
      setIsAdding(false);
      setNewReportagem({
        retranca: "",
        corpo_materia: "",
        reporter: "",
        local: "",
        data_gravacao: "",
      });
    },
    onError: () => {
      toast.error("Erro ao criar reportagem");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Reportagem> }) =>
      updateReportagem(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reportagens", telejornalId] });
      toast.success("Reportagem atualizada com sucesso!");
      setEditingId(null);
    },
    onError: () => {
      toast.error("Erro ao atualizar reportagem");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReportagem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reportagens", telejornalId] });
      toast.success("Reportagem excluída com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao excluir reportagem");
    },
  });

  const handleCreate = () => {
    if (!newReportagem.retranca.trim()) {
      toast.error("A retranca é obrigatória");
      return;
    }

    createMutation.mutate({
      telejornal_id: telejornalId,
      ...newReportagem,
      status: "em_producao",
    });
  };

  const handleEdit = (reportagem: Reportagem) => {
    setEditingId(reportagem.id);
    setEditReportagem({
      retranca: reportagem.retranca || "",
      corpo_materia: reportagem.corpo_materia || "",
      reporter: reportagem.reporter || "",
      local: reportagem.local || "",
      data_gravacao: reportagem.data_gravacao || "",
    });
    setIsAdding(false);
  };

  const handleUpdate = () => {
    if (!editReportagem.retranca.trim()) {
      toast.error("A retranca é obrigatória");
      return;
    }

    updateMutation.mutate({
      id: editingId!,
      updates: editReportagem,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditReportagem({
      retranca: "",
      corpo_materia: "",
      reporter: "",
      local: "",
      data_gravacao: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reportagens - {telejornalNome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Lista de Reportagens</h3>
            <Button
              size="sm"
              onClick={() => setIsAdding(!isAdding)}
              variant={isAdding ? "secondary" : "default"}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              {isAdding ? "Cancelar" : "Nova Reportagem"}
            </Button>
          </div>

          {isAdding && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
              <div>
                <Label htmlFor="retranca">Retranca*</Label>
                <Input
                  id="retranca"
                  value={newReportagem.retranca}
                  onChange={(e) =>
                    setNewReportagem({ ...newReportagem, retranca: e.target.value })
                  }
                  placeholder="Digite a retranca da reportagem"
                />
              </div>

              <div>
                <Label htmlFor="corpo_materia">Corpo da Matéria</Label>
                <Textarea
                  id="corpo_materia"
                  value={newReportagem.corpo_materia}
                  onChange={(e) =>
                    setNewReportagem({ ...newReportagem, corpo_materia: e.target.value })
                  }
                  placeholder="Corpo da matéria"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="reporter">Repórter</Label>
                  <Input
                    id="reporter"
                    value={newReportagem.reporter}
                    onChange={(e) =>
                      setNewReportagem({ ...newReportagem, reporter: e.target.value })
                    }
                    placeholder="Nome do repórter"
                  />
                </div>

                <div>
                  <Label htmlFor="local">Local</Label>
                  <Input
                    id="local"
                    value={newReportagem.local}
                    onChange={(e) =>
                      setNewReportagem({ ...newReportagem, local: e.target.value })
                    }
                    placeholder="Local da gravação"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="data_gravacao">Data de Gravação</Label>
                <Input
                  id="data_gravacao"
                  type="date"
                  value={newReportagem.data_gravacao}
                  onChange={(e) =>
                    setNewReportagem({ ...newReportagem, data_gravacao: e.target.value })
                  }
                />
              </div>

              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="w-full"
              >
                Criar Reportagem
              </Button>
            </div>
          )}

          <div className="space-y-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : reportagens && reportagens.length > 0 ? (
              reportagens.map((reportagem) => (
                <div key={reportagem.id}>
                  {editingId === reportagem.id ? (
                    <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
                      <div>
                        <Label>Retranca*</Label>
                        <Input
                          value={editReportagem.retranca}
                          onChange={(e) =>
                            setEditReportagem({ ...editReportagem, retranca: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label>Corpo da Matéria</Label>
                        <Textarea
                          value={editReportagem.corpo_materia}
                          onChange={(e) =>
                            setEditReportagem({ ...editReportagem, corpo_materia: e.target.value })
                          }
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Repórter</Label>
                          <Input
                            value={editReportagem.reporter}
                            onChange={(e) =>
                              setEditReportagem({ ...editReportagem, reporter: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label>Local</Label>
                          <Input
                            value={editReportagem.local}
                            onChange={(e) =>
                              setEditReportagem({ ...editReportagem, local: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Data de Gravação</Label>
                        <Input
                          type="date"
                          value={editReportagem.data_gravacao}
                          onChange={(e) =>
                            setEditReportagem({ ...editReportagem, data_gravacao: e.target.value })
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
                        <h4 className="font-medium">{reportagem.retranca}</h4>
                        {reportagem.corpo_materia && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {reportagem.corpo_materia}
                          </p>
                        )}
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          {reportagem.reporter && <span>Repórter: {reportagem.reporter}</span>}
                          {reportagem.local && <span>Local: {reportagem.local}</span>}
                          {reportagem.data_gravacao && (
                            <span>Data: {new Date(reportagem.data_gravacao).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(reportagem)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMutation.mutate(reportagem.id)}
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
                Nenhuma reportagem cadastrada
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
