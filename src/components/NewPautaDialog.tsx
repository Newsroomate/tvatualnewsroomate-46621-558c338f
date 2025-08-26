import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPauta } from "@/services/pautas-api";
import { useToast } from "@/hooks/use-toast";

interface NewPautaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPautaCreated: () => void;
}

export const NewPautaDialog = ({
  isOpen,
  onClose,
  onPautaCreated,
}: NewPautaDialogProps) => {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [local, setLocal] = useState("");
  const [horario, setHorario] = useState("");
  const [entrevistado, setEntrevistado] = useState("");
  const [produtor, setProdutor] = useState("");
  const [proposta, setProposta] = useState("");
  const [encaminhamento, setEncaminhamento] = useState("");
  const [informacoes, setInformacoes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setTitulo("");
    setDescricao("");
    setLocal("");
    setHorario("");
    setEntrevistado("");
    setProdutor("");
    setProposta("");
    setEncaminhamento("");
    setInformacoes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    
    setIsSubmitting(true);
    try {
      await createPauta({ 
        titulo,
        descricao: descricao || undefined,
        local: local || undefined,
        horario: horario || undefined,
        entrevistado: entrevistado || undefined,
        produtor: produtor || undefined,
        proposta: proposta || undefined,
        encaminhamento: encaminhamento || undefined,
        informacoes: informacoes || undefined
      });
      
      toast({
        title: "Pauta criada com sucesso",
        description: "A nova pauta foi adicionada à lista.",
      });
      
      onPautaCreated();
      resetForm();
      onClose();
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
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
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
              <Textarea
                id="local"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                placeholder="Local da cobertura"
                rows={3}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="proposta">Proposta</Label>
              <Textarea
                id="proposta"
                value={proposta}
                onChange={(e) => setProposta(e.target.value)}
                placeholder="Digite a proposta"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="encaminhamento">Encaminhamento</Label>
              <Textarea
                id="encaminhamento"
                value={encaminhamento}
                onChange={(e) => setEncaminhamento(e.target.value)}
                placeholder="Digite o encaminhamento"
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="informacoes">Informações Adicionais</Label>
            <Textarea
              id="informacoes"
              value={informacoes}
              onChange={(e) => setInformacoes(e.target.value)}
              placeholder="Digite as informações adicionais"
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!titulo.trim() || isSubmitting}
            >
              {isSubmitting ? "Criando..." : "Criar Pauta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};