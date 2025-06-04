
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createModelo } from "@/services/models-api";
import { Telejornal, Bloco, Materia } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

interface SaveModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTelejornal: Telejornal | null;
  blocks: (Bloco & { items: Materia[], totalTime: number })[];
}

export const SaveModelModal = ({
  isOpen,
  onClose,
  currentTelejornal,
  blocks
}: SaveModelModalProps) => {
  const [modelName, setModelName] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createModelo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelos'] });
      toast({
        title: "Modelo salvo",
        description: "O modelo foi salvo com sucesso.",
      });
      setModelName("");
      onClose();
    },
    onError: (error) => {
      console.error('Erro ao salvar modelo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o modelo.",
        variant: "destructive",
      });
    }
  });

  const handleSave = () => {
    if (!modelName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para o modelo.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Erro de autenticação",
        description: "Usuário não autenticado.",
        variant: "destructive",
      });
      return;
    }

    // Criar estrutura do modelo removendo IDs específicos para reutilização
    const estrutura = {
      blocos: blocks.map((bloco, blocoIndex) => ({
        id: `modelo_bloco_${blocoIndex + 1}`,
        nome: bloco.nome,
        ordem: bloco.ordem,
        materias: bloco.items.map((materia, materiaIndex) => ({
          id: `modelo_materia_${blocoIndex + 1}_${materiaIndex + 1}`,
          retranca: materia.retranca,
          duracao: materia.duracao,
          ordem: materia.ordem,
          clip: materia.clip,
          tempo_clip: materia.tempo_clip,
          pagina: materia.pagina,
          reporter: materia.reporter,
          status: materia.status,
          texto: materia.texto,
          cabeca: materia.cabeca,
          gc: materia.gc
        }))
      }))
    };

    createMutation.mutate({
      nome: modelName.trim(),
      telejornal_id: currentTelejornal?.id || null,
      estrutura,
      user_id: user.id
    });
  };

  const handleClose = () => {
    setModelName("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Salvar Modelo</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="model-name">Nome do Modelo</Label>
            <Input
              id="model-name"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="Digite o nome do modelo..."
              disabled={createMutation.isPending}
            />
          </div>
          
          <p className="text-sm text-muted-foreground">
            Este modelo incluirá {blocks.length} bloco(s) e{' '}
            {blocks.reduce((total, bloco) => total + bloco.items.length, 0)} matéria(s).
          </p>
          
          <div className="flex justify-between">
            <Button variant="ghost" onClick={handleClose} disabled={createMutation.isPending}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || !modelName.trim()}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Modelo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
