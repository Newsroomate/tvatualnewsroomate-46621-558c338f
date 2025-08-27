
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
  const [data, setData] = useState("");
  const [retranca, setRetranca] = useState("");
  const [programa, setPrograma] = useState("");
  const [pauteiros, setPauteiros] = useState("");
  const [reporter, setReporter] = useState("");
  const [imagens, setImagens] = useState("");
  const [programas, setProgramas] = useState("");
  const [roteiro1, setRoteiro1] = useState("");
  const [entrevistados, setEntrevistados] = useState("");
  const [proposta, setProposta] = useState("");
  const [encaminhamento, setEncaminhamento] = useState("");
  const [informacoes, setInformacoes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!retranca.trim()) return;

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
        titulo: retranca, // Use retranca as titulo for compatibility
        descricao: roteiro1,
        local: imagens,
        horario: data,
        entrevistado: entrevistados,
        produtor: pauteiros,
        proposta,
        encaminhamento,
        informacoes,
        status: "pendente",
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
    setData("");
    setRetranca("");
    setPrograma("");
    setPauteiros("");
    setReporter("");
    setImagens("");
    setProgramas("");
    setRoteiro1("");
    setEntrevistados("");
    setProposta("");
    setEncaminhamento("");
    setInformacoes("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Pauta</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">DATA</Label>
              <Input
                id="data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="retranca">RETRANCA</Label>
              <Input
                id="retranca"
                value={retranca}
                onChange={(e) => setRetranca(e.target.value)}
                placeholder="Digite a retranca"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="programa">PROGRAMA</Label>
              <Input
                id="programa"
                value={programa}
                onChange={(e) => setPrograma(e.target.value)}
                placeholder="Nome do programa"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pauteiros">PAUTEIROS</Label>
              <Input
                id="pauteiros"
                value={pauteiros}
                onChange={(e) => setPauteiros(e.target.value)}
                placeholder="Nome dos pauteiros"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reporter">REPÓRTER</Label>
              <Input
                id="reporter"
                value={reporter}
                onChange={(e) => setReporter(e.target.value)}
                placeholder="Nome do repórter"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="imagens">IMAGENS</Label>
              <Textarea
                id="imagens"
                value={imagens}
                onChange={(e) => setImagens(e.target.value)}
                placeholder="Informações sobre imagens"
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="programas">PROGRAMAS</Label>
              <Textarea
                id="programas"
                value={programas}
                onChange={(e) => setProgramas(e.target.value)}
                placeholder="Programas relacionados"
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="roteiro1">ROTEIRO 1</Label>
            <Textarea
              id="roteiro1"
              value={roteiro1}
              onChange={(e) => setRoteiro1(e.target.value)}
              placeholder="Conteúdo do roteiro"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entrevistados">ENTREVISTADOS</Label>
            <Textarea
              id="entrevistados"
              value={entrevistados}
              onChange={(e) => setEntrevistados(e.target.value)}
              placeholder="Lista de entrevistados"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="proposta">PROPOSTA</Label>
              <Textarea
                id="proposta"
                value={proposta}
                onChange={(e) => setProposta(e.target.value)}
                placeholder="Descrição da proposta"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="encaminhamento">ENCAMINHAMENTO</Label>
              <Textarea
                id="encaminhamento"
                value={encaminhamento}
                onChange={(e) => setEncaminhamento(e.target.value)}
                placeholder="Encaminhamento da pauta"
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="informacoes">INFORMAÇÕES</Label>
            <Textarea
              id="informacoes"
              value={informacoes}
              onChange={(e) => setInformacoes(e.target.value)}
              placeholder="Informações adicionais"
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || !retranca.trim()}>
              {isSubmitting ? "Salvando..." : "Salvar Pauta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
