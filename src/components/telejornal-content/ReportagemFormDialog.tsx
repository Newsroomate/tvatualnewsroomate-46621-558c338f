import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { createReportagem, updateReportagem } from "@/services/reportagens-api";
import { Reportagem, ReportagemCreateInput } from "@/types/reportagens";
import { toast } from "sonner";

interface ReportagemFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  telejornalId: string;
  reportagem?: Reportagem | null;
  onSuccess: () => void;
}

export const ReportagemFormDialog = ({
  isOpen,
  onClose,
  telejornalId,
  reportagem,
  onSuccess
}: ReportagemFormDialogProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ReportagemCreateInput>({
    titulo: "",
    descricao: "",
    reporter: "",
    editor: "",
    local_gravacao: "",
    data_gravacao: "",
    duracao: 0,
    status: "em_producao",
    observacoes: "",
    equipamento: ""
  });

  useEffect(() => {
    if (reportagem) {
      setFormData({
        titulo: reportagem.titulo,
        descricao: reportagem.descricao || "",
        reporter: reportagem.reporter || "",
        editor: reportagem.editor || "",
        local_gravacao: reportagem.local_gravacao || "",
        data_gravacao: reportagem.data_gravacao || "",
        duracao: reportagem.duracao || 0,
        status: reportagem.status || "em_producao",
        observacoes: reportagem.observacoes || "",
        equipamento: reportagem.equipamento || ""
      });
    } else {
      setFormData({
        titulo: "",
        descricao: "",
        reporter: "",
        editor: "",
        local_gravacao: "",
        data_gravacao: "",
        duracao: 0,
        status: "em_producao",
        observacoes: "",
        equipamento: ""
      });
    }
  }, [reportagem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    try {
      if (reportagem) {
        await updateReportagem(reportagem.id, formData);
        toast.success("Reportagem atualizada com sucesso!");
      } else {
        if (!user?.id) {
          toast.error("Usuário não autenticado");
          return;
        }
        await createReportagem(formData, telejornalId, user.id);
        toast.success("Reportagem criada com sucesso!");
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar reportagem:", error);
      toast.error("Erro ao salvar reportagem");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{reportagem ? "Editar Reportagem" : "Nova Reportagem"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reporter">Repórter</Label>
              <Input
                id="reporter"
                value={formData.reporter}
                onChange={(e) => setFormData({ ...formData, reporter: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="editor">Editor</Label>
              <Input
                id="editor"
                value={formData.editor}
                onChange={(e) => setFormData({ ...formData, editor: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="local_gravacao">Local de Gravação</Label>
              <Input
                id="local_gravacao"
                value={formData.local_gravacao}
                onChange={(e) => setFormData({ ...formData, local_gravacao: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="data_gravacao">Data de Gravação</Label>
              <Input
                id="data_gravacao"
                type="date"
                value={formData.data_gravacao}
                onChange={(e) => setFormData({ ...formData, data_gravacao: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duracao">Duração (segundos)</Label>
              <Input
                id="duracao"
                type="number"
                value={formData.duracao}
                onChange={(e) => setFormData({ ...formData, duracao: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="em_producao">Em Produção</SelectItem>
                  <SelectItem value="finalizada">Finalizada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="equipamento">Equipamento</Label>
            <Input
              id="equipamento"
              value={formData.equipamento}
              onChange={(e) => setFormData({ ...formData, equipamento: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {reportagem ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
