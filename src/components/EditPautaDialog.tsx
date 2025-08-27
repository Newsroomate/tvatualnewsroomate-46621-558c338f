import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AutoTextarea } from "@/components/ui/auto-textarea";
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
  onPautaUpdated
}: EditPautaDialogProps) => {
  const [data, setData] = useState(pauta.data_cobertura || pauta.horario || "");
  const [retranca, setRetranca] = useState(pauta.titulo);
  const [programa, setPrograma] = useState("");
  const [pauteiros, setPauteiros] = useState(pauta.produtor || "");
  const [reporter, setReporter] = useState("");
  const [imagens, setImagens] = useState(pauta.local || "");
  const [programas, setProgramas] = useState("");
  const [roteiro1, setRoteiro1] = useState(pauta.descricao || "");
  const [entrevistados, setEntrevistados] = useState(pauta.entrevistado || "");
  const [proposta, setProposta] = useState(pauta.proposta || "");
  const [encaminhamento, setEncaminhamento] = useState(pauta.encaminhamento || "");
  const [informacoes, setInformacoes] = useState(pauta.informacoes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    toast
  } = useToast();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!retranca.trim()) return;
    setIsSubmitting(true);
    try {
      await updatePauta(pauta.id, {
        titulo: retranca,
        // Use retranca as titulo for compatibility
        descricao: roteiro1,
        local: imagens,
        horario: data,
        entrevistado: entrevistados,
        produtor: pauteiros,
        proposta,
        encaminhamento,
        informacoes,
        data_cobertura: data // Map DATA field to data_cobertura
      });
      onPautaUpdated();
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar pauta:", error);
      toast({
        title: "Erro ao atualizar pauta",
        description: "Ocorreu um erro ao atualizar a pauta. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Pauta</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="data">DATA</Label>
              <Input id="data" type="date" value={data} onChange={e => setData(e.target.value)} required />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="imagens">IMAGENS</Label>
              <AutoTextarea id="imagens" value={imagens} onChange={e => setImagens(e.target.value)} placeholder="Informações sobre imagens" />
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
              <Label htmlFor="pauteiros">PAUTEIROS</Label>
              <Input id="pauteiros" value={pauteiros} onChange={e => setPauteiros(e.target.value)} placeholder="Nome dos pauteiros" />
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
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!retranca.trim() || isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>;
};