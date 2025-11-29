import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AutoTextarea } from "@/components/ui/auto-textarea";
import { createPauta } from "@/services/pautas-api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { usePermissionGuard } from "@/hooks/usePermissionGuard";

interface PautaIndependenteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPautaCreated: () => void;
}

export const PautaIndependenteModal = ({
  isOpen,
  onClose,
  onPautaCreated
}: PautaIndependenteModalProps) => {
  const [data, setData] = useState("");
  const [retranca, setRetranca] = useState("");
  const [programa, setPrograma] = useState("");
  const [produtor, setProdutor] = useState("");
  const [reporter, setReporter] = useState("");
  const [imagens, setImagens] = useState("");
  const [roteiro1, setRoteiro1] = useState("");
  const [entrevistados, setEntrevistados] = useState("");
  const [proposta, setProposta] = useState("");
  const [encaminhamento, setEncaminhamento] = useState("");
  const [informacoes, setInformacoes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { guardAction } = usePermissionGuard();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!retranca.trim()) return;
    
    console.log('[PautaIndependenteModal] user:', user);
    console.log('[PautaIndependenteModal] user.id:', user?.id);
    
    if (!user || !user.id) {
      console.error('[PautaIndependenteModal] Usuário não autenticado ou sem ID');
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para criar uma pauta.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    await guardAction('create', 'pauta', async () => {
      const pautaData = {
        titulo: retranca,
        descricao: roteiro1,
        local: imagens,
        horario: data,
        entrevistado: entrevistados,
        produtor,
        proposta,
        encaminhamento,
        informacoes,
        status: "pendente",
        data_cobertura: data,
        programa,
        reporter
      };

      console.log('[PautaIndependenteModal] Criando pauta independente:', pautaData);
      await createPauta(pautaData, user.id);
      
      toast({
        title: "Sucesso!",
        description: "Pauta criada com sucesso.",
      });
      
      onPautaCreated();
      handleClose();
    });
    
    setIsSubmitting(false);
  };

  const handleClose = () => {
    setData("");
    setRetranca("");
    setPrograma("");
    setProdutor("");
    setReporter("");
    setImagens("");
    setRoteiro1("");
    setEntrevistados("");
    setProposta("");
    setEncaminhamento("");
    setInformacoes("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Pauta Independente</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="data">DATA</Label>
              <Input id="data" type="date" value={data} onChange={e => setData(e.target.value)} required />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="imagens">IMAGENS</Label>
              <Input id="imagens" value={imagens} onChange={e => setImagens(e.target.value)} placeholder="Informações sobre imagens" />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="programa">PROGRAMA</Label>
              <Input id="programa" value={programa} onChange={e => setPrograma(e.target.value)} placeholder="Nome do programa" />
            </div>
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="retranca">RETRANCA</Label>
            <Input id="retranca" value={retranca} onChange={e => setRetranca(e.target.value)} placeholder="Digite a retranca" required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="produtor">PRODUTOR</Label>
              <Input id="produtor" value={produtor} onChange={e => setProdutor(e.target.value)} placeholder="Nome do produtor" />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="reporter">REPÓRTER</Label>
              <Input id="reporter" value={reporter} onChange={e => setReporter(e.target.value)} placeholder="Nome do repórter" />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="roteiro1">ROTEIRO 1</Label>
            <AutoTextarea id="roteiro1" value={roteiro1} onChange={e => setRoteiro1(e.target.value)} placeholder="Conteúdo do roteiro" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="entrevistados">ENTREVISTADOS</Label>
            <AutoTextarea id="entrevistados" value={entrevistados} onChange={e => setEntrevistados(e.target.value)} placeholder="Lista de entrevistados" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="proposta">PROPOSTA</Label>
            <AutoTextarea id="proposta" value={proposta} onChange={e => setProposta(e.target.value)} placeholder="Descrição da proposta" />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="encaminhamento">ENCAMINHAMENTO</Label>
            <AutoTextarea id="encaminhamento" value={encaminhamento} onChange={e => setEncaminhamento(e.target.value)} placeholder="Encaminhamento da pauta" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="informacoes">INFORMAÇÕES</Label>
            <AutoTextarea id="informacoes" value={informacoes} onChange={e => setInformacoes(e.target.value)} placeholder="Informações adicionais" />
          </div>
          
          <DialogFooter className="pt-3">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !retranca.trim()}>
              {isSubmitting ? "Salvando..." : "Salvar Pauta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
