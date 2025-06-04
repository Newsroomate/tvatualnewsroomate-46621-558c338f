
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Bloco, Materia, Telejornal } from "@/types";
import { createModeloEspelho } from "@/services/modelos-espelho-api";
import { useToast } from "@/hooks/use-toast";

type BlockWithItems = Bloco & { 
  items: Materia[];
  totalTime: number;
};

interface SaveModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: BlockWithItems[];
  currentTelejornal: Telejornal | null;
}

export const SaveModelModal = ({
  isOpen,
  onClose,
  blocks,
  currentTelejornal
}: SaveModelModalProps) => {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSave = async () => {
    setError(null);
    
    if (!nome.trim()) {
      setError("Por favor, informe um nome para o modelo");
      return;
    }

    if (blocks.length === 0) {
      setError("Não é possível salvar um modelo sem blocos");
      return;
    }

    setIsSaving(true);

    try {
      const estrutura = {
        blocos: blocks.map(block => ({
          id: block.id,
          nome: block.nome,
          ordem: block.ordem,
          items: block.items.map(item => ({
            id: item.id,
            retranca: item.retranca,
            clip: item.clip,
            tempo_clip: item.tempo_clip,
            duracao: item.duracao || 0,
            pagina: item.pagina,
            reporter: item.reporter,
            status: item.status,
            texto: item.texto,
            cabeca: item.cabeca,
            gc: item.gc,
            ordem: item.ordem
          }))
        }))
      };

      await createModeloEspelho({
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        telejornal_id: currentTelejornal?.id,
        estrutura
      });

      // Reset form
      setNome("");
      setDescricao("");
      setError(null);
      onClose();
    } catch (error) {
      console.error("Erro ao salvar modelo:", error);
      setError("Falha ao salvar o modelo. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setNome("");
    setDescricao("");
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Salvar Modelo de Espelho</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div>
            <Label htmlFor="nome">Nome do Modelo *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Modelo Padrão Manhã"
              maxLength={100}
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
              rows={3}
              maxLength={500}
              disabled={isSaving}
            />
          </div>
          
          <div className="text-sm text-gray-600">
            <p><strong>Estrutura atual:</strong></p>
            <p>{blocks.length} bloco(s) com {blocks.reduce((total, block) => total + block.items.length, 0)} matéria(s)</p>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar Modelo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
