
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { saveCurrentStructureAsModel } from "@/services/models-api";
import { Loader2 } from "lucide-react";

interface SaveModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  telejornalId: string;
}

export const SaveModelModal = ({
  isOpen,
  onClose,
  telejornalId
}: SaveModelModalProps) => {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!nome.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe um nome para o modelo",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      await saveCurrentStructureAsModel(telejornalId, {
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        estrutura: { blocos: [] } // Será preenchido pela função
      });

      toast({
        title: "Modelo salvo",
        description: `O modelo "${nome}" foi salvo com sucesso`,
      });

      // Reset form
      setNome("");
      setDescricao("");
      onClose();
    } catch (error) {
      console.error("Erro ao salvar modelo:", error);
      toast({
        title: "Erro ao salvar modelo",
        description: "Não foi possível salvar o modelo",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setNome("");
      setDescricao("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Salvar Modelo</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome do Modelo *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Telejornal Padrão"
              disabled={isSaving}
            />
          </div>
          
          <div>
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva quando usar este modelo..."
              disabled={isSaving}
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar Modelo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
