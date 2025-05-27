
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updatePauta } from "@/services/pautas-api";
import { Pauta } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface EditPautaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pauta: Pauta;
  onPautaUpdated: () => void;
}

export const EditPautaDialog = ({
  isOpen,
  onClose,
  pauta,
  onPautaUpdated,
}: EditPautaDialogProps) => {
  const [titulo, setTitulo] = useState(pauta.titulo);
  const [descricao, setDescricao] = useState(pauta.descricao || "");
  const [local, setLocal] = useState(pauta.local || "");
  const [horario, setHorario] = useState(pauta.horario || "");
  const [entrevistado, setEntrevistado] = useState(pauta.entrevistado || "");
  const [produtor, setProdutor] = useState(pauta.produtor || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    
    setIsSubmitting(true);
    try {
      await updatePauta(pauta.id, { 
        titulo,
        descricao,
        local,
        horario,
        entrevistado,
        produtor
      });
      
      toast({
        title: "Pauta atualizada",
        description: `${titulo} foi atualizada com sucesso`,
      });
      
      onPautaUpdated();
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar pauta:", error);
      toast({
        title: "Erro ao atualizar pauta",
        description: "Ocorreu um erro ao atualizar a pauta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Pauta</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título da Pauta</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Digite o título da pauta"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva os detalhes da pauta"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="local">Local</Label>
              <Input
                id="local"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                placeholder="Local da cobertura"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="horario">Horário</Label>
              <Input
                id="horario"
                type="time"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entrevistado">Entrevistado</Label>
              <Input
                id="entrevistado"
                value={entrevistado}
                onChange={(e) => setEntrevistado(e.target.value)}
                placeholder="Nome do entrevistado"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="produtor">Produtor</Label>
              <Input
                id="produtor"
                value={produtor}
                onChange={(e) => setProdutor(e.target.value)}
                placeholder="Nome do produtor"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!titulo.trim() || isSubmitting}
            >
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
