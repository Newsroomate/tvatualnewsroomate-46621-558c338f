import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { createEntrevista, updateEntrevista } from "@/services/entrevistas-api";
import { Entrevista, EntrevistaCreateInput } from "@/types/entrevistas";
import { toast } from "sonner";

interface EntrevistaFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  telejornalId: string;
  entrevista?: Entrevista | null;
  onSuccess: () => void;
}

export const EntrevistaFormDialog = ({
  isOpen,
  onClose,
  telejornalId,
  entrevista,
  onSuccess
}: EntrevistaFormDialogProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<EntrevistaCreateInput>({
    titulo: "",
    entrevistado: "",
    tema: "",
    descricao: "",
    reporter: "",
    local: "",
    data_entrevista: "",
    duracao: 0,
    status: "agendada",
    observacoes: ""
  });

  useEffect(() => {
    if (entrevista) {
      setFormData({
        titulo: entrevista.titulo,
        entrevistado: entrevista.entrevistado,
        tema: entrevista.tema || "",
        descricao: entrevista.descricao || "",
        reporter: entrevista.reporter || "",
        local: entrevista.local || "",
        data_entrevista: entrevista.data_entrevista || "",
        duracao: entrevista.duracao || 0,
        status: entrevista.status || "agendada",
        observacoes: entrevista.observacoes || ""
      });
    } else {
      setFormData({
        titulo: "",
        entrevistado: "",
        tema: "",
        descricao: "",
        reporter: "",
        local: "",
        data_entrevista: "",
        duracao: 0,
        status: "agendada",
        observacoes: ""
      });
    }
  }, [entrevista, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo.trim() || !formData.entrevistado.trim()) {
      toast.error("Título e Entrevistado são obrigatórios");
      return;
    }

    try {
      if (entrevista) {
        await updateEntrevista(entrevista.id, formData);
        toast.success("Entrevista atualizada com sucesso!");
      } else {
        if (!user?.id) {
          toast.error("Usuário não autenticado");
          return;
        }
        await createEntrevista(formData, telejornalId, user.id);
        toast.success("Entrevista criada com sucesso!");
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar entrevista:", error);
      toast.error("Erro ao salvar entrevista");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{entrevista ? "Editar Entrevista" : "Nova Entrevista"}</DialogTitle>
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
            <Label htmlFor="entrevistado">Entrevistado *</Label>
            <Input
              id="entrevistado"
              value={formData.entrevistado}
              onChange={(e) => setFormData({ ...formData, entrevistado: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="tema">Tema</Label>
            <Input
              id="tema"
              value={formData.tema}
              onChange={(e) => setFormData({ ...formData, tema: e.target.value })}
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
              <Label htmlFor="local">Local</Label>
              <Input
                id="local"
                value={formData.local}
                onChange={(e) => setFormData({ ...formData, local: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data_entrevista">Data da Entrevista</Label>
              <Input
                id="data_entrevista"
                type="date"
                value={formData.data_entrevista}
                onChange={(e) => setFormData({ ...formData, data_entrevista: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="duracao">Duração (minutos)</Label>
              <Input
                id="duracao"
                type="number"
                value={formData.duracao}
                onChange={(e) => setFormData({ ...formData, duracao: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agendada">Agendada</SelectItem>
                <SelectItem value="realizada">Realizada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
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
              {entrevista ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
