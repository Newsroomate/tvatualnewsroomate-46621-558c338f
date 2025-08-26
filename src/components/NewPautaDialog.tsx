import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createPauta } from "@/services/pautas-api";
import { toast } from "sonner";
import { PautaCreateInput } from "@/types";

interface NewPautaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPautaCreated: () => void;
}

export function NewPautaDialog({ isOpen, onClose, onPautaCreated }: NewPautaDialogProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!titulo.trim()) {
      toast.error("O título da pauta é obrigatório");
      return;
    }

    setIsSubmitting(true);

    try {
      const newPauta: PautaCreateInput = {
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        local: local.trim() || undefined,
        horario: horario.trim() || undefined,
        entrevistado: entrevistado.trim() || undefined,
        produtor: produtor.trim() || undefined,
        proposta: proposta.trim() || undefined,
        encaminhamento: encaminhamento.trim() || undefined,
        informacoes: informacoes.trim() || undefined,
      };

      await createPauta(newPauta);
      
      // Reset form
      setTitulo("");
      setDescricao("");
      setLocal("");
      setHorario("");
      setEntrevistado("");
      setProdutor("");
      setProposta("");
      setEncaminhamento("");
      setInformacoes("");
      
      onPautaCreated();
      onClose();
      toast.success("Pauta criada com sucesso!");
    } catch (error) {
      console.error("Erro ao criar pauta:", error);
      toast.error("Erro ao criar pauta");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
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
              className="h-20 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                placeholder="--:--"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entrevistado">Entrevistado</Label>
              <Textarea
                id="entrevistado"
                value={entrevistado}
                onChange={(e) => setEntrevistado(e.target.value)}
                placeholder="Nome do entrevistado"
                className="h-16 resize-none"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="proposta">Proposta</Label>
              <Textarea
                id="proposta"
                value={proposta}
                onChange={(e) => setProposta(e.target.value)}
                placeholder="Digite a proposta"
                className="h-16 resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="encaminhamento">Encaminhamento</Label>
              <Textarea
                id="encaminhamento"
                value={encaminhamento}
                onChange={(e) => setEncaminhamento(e.target.value)}
                placeholder="Digite o encaminhamento"
                className="h-16 resize-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="informacoes">Informações</Label>
            <Textarea
              id="informacoes"
              value={informacoes}
              onChange={(e) => setInformacoes(e.target.value)}
              placeholder="Digite as informações adicionais"
              className="h-16 resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!titulo.trim() || isSubmitting}
            >
              Salvar Pauta
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}