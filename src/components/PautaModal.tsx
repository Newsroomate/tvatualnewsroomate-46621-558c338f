
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPauta } from "@/services/pautas-api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

interface PautaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPautaCreated: () => void;
}

export const PautaModal = ({ isOpen, onClose, onPautaCreated }: PautaModalProps) => {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [local, setLocal] = useState("");
  const [horario, setHorario] = useState("");
  const [entrevistado, setEntrevistado] = useState("");
  const [produtor, setProdutor] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para criar uma pauta.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createPauta({
        titulo,
        descricao,
        local,
        horario,
        entrevistado,
        produtor,
        status: "pendente",
      });
      
      toast({
        title: "Pauta criada",
        description: `${titulo} foi adicionada com sucesso`,
      });
      
      onPautaCreated();
      handleClose();
    } catch (error) {
      console.error("Erro ao criar pauta:", error);
      toast({
        title: "Erro ao criar pauta",
        description: "Ocorreu um erro ao criar a pauta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitulo("");
    setDescricao("");
    setLocal("");
    setHorario("");
    setEntrevistado("");
    setProdutor("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Pauta</DialogTitle>
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
            <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || !titulo.trim()}>
              {isSubmitting ? "Salvando..." : "Salvar Pauta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
