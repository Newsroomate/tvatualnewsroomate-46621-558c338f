
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createModelo } from "@/services/modelos-api";
import { useAuth } from "@/context/AuthContext";
import { Bloco, Materia } from "@/types";

interface SaveModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: (Bloco & { items: Materia[] })[];
}

export const SaveModelModal = ({ isOpen, onClose, blocks }: SaveModelModalProps) => {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSave = async () => {
    if (!nome.trim()) {
      toast({
        title: "Erro",
        description: "O nome do modelo é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (blocks.length === 0) {
      toast({
        title: "Erro", 
        description: "Não é possível salvar um modelo sem blocos.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Converter a estrutura atual para o formato do modelo
      const estrutura = {
        blocos: blocks.map(block => ({
          nome: block.nome,
          ordem: block.ordem,
          materias: block.items.map(item => ({
            retranca: item.retranca,
            clip: item.clip || "",
            tempo_clip: item.tempo_clip || "",
            duracao: item.duracao,
            texto: item.texto || "",
            cabeca: item.cabeca || "",
            gc: item.gc || "",
            status: item.status || "draft",
            pagina: item.pagina || "",
            reporter: item.reporter || "",
            local_gravacao: item.local_gravacao || "",
            tags: item.tags || [],
            equipamento: item.equipamento || "",
            ordem: item.ordem
          }))
        }))
      };

      await createModelo({
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        estrutura,
        user_id: user?.id
      });

      toast({
        title: "Sucesso",
        description: "Modelo salvo com sucesso!",
      });

      // Limpar o formulário e fechar
      setNome("");
      setDescricao("");
      onClose();
    } catch (error) {
      console.error("Erro ao salvar modelo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o modelo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setNome("");
    setDescricao("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Salvar Modelo de Espelho</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Salve a estrutura atual do espelho como um modelo para reutilização futura.
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Modelo *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Modelo Padrão Jornal da Manhã"
              maxLength={100}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição do modelo..."
              rows={3}
              maxLength={500}
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>Este modelo incluirá:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>{blocks.length} bloco(s)</li>
              <li>{blocks.reduce((total, block) => total + block.items.length, 0)} matéria(s)</li>
            </ul>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar Modelo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
