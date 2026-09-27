import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AutoTextarea } from "@/components/ui/auto-textarea";
import { useAuth } from "@/context/AuthContext";
import { createPauta, updatePauta } from "@/services/api";
import { linkPautaToTelejornal } from "@/services/pautas-telejornal-api";
import { Pauta, PautaCreateInput, ContatoEntrevistado } from "@/types";
import { toast } from "sonner";
import { EntrevistadosField } from "./EntrevistadosField";
import { upsertContatos } from "@/services/contatos-entrevistados-api";

interface PautaTelejornalFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  telejornalId: string;
  pauta?: Pauta | null;
  onSuccess: () => void;
}

export const PautaTelejornalFormDialog = ({
  isOpen,
  onClose,
  telejornalId,
  pauta,
  onSuccess
}: PautaTelejornalFormDialogProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contatos, setContatos] = useState<ContatoEntrevistado[]>([{ nome: "", telefone: "", email: "" }]);
  const [formData, setFormData] = useState<PautaCreateInput>({
    titulo: "",
    descricao: "",
    local: "",
    horario: "",
    entrevistado: "",
    produtor: "",
    proposta: "",
    encaminhamento: "",
    informacoes: "",
    data_cobertura: "",
    programa: "",
    reporter: "",
    status: "pendente"
  });

  useEffect(() => {
    if (pauta) {
      setFormData({
        titulo: pauta.titulo,
        descricao: pauta.descricao || "",
        local: pauta.local || "",
        horario: pauta.horario || "",
        entrevistado: pauta.entrevistado || "",
        produtor: pauta.produtor || "",
        proposta: pauta.proposta || "",
        encaminhamento: pauta.encaminhamento || "",
        informacoes: pauta.informacoes || "",
        data_cobertura: pauta.data_cobertura || "",
        programa: pauta.programa || "",
        reporter: pauta.reporter || "",
        status: pauta.status || "pendente"
      });
      // Carrega contatos estruturados; se não houver, faz fallback do texto legado
      if (pauta.entrevistados_contatos && pauta.entrevistados_contatos.length > 0) {
        setContatos(pauta.entrevistados_contatos);
      } else if (pauta.entrevistado?.trim()) {
        const nomes = pauta.entrevistado.split(/[,;\n]/).map(n => n.trim()).filter(Boolean);
        setContatos(nomes.length > 0 ? nomes.map(n => ({ nome: n, telefone: "", email: "" })) : [{ nome: "", telefone: "", email: "" }]);
      } else {
        setContatos([{ nome: "", telefone: "", email: "" }]);
      }
    } else {
      setFormData({
        titulo: "",
        descricao: "",
        local: "",
        horario: "",
        entrevistado: "",
        produtor: "",
        proposta: "",
        encaminhamento: "",
        informacoes: "",
        data_cobertura: new Date().toISOString().slice(0, 10),
        programa: "",
        reporter: "",
        status: "pendente"
      });
      setContatos([{ nome: "", telefone: "", email: "" }]);
    }
  }, [pauta, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    setIsSubmitting(true);

    try {
      // Limpa contatos vazios e prepara payload
      const cleanContatos = contatos
        .map(c => ({
          nome: c.nome?.trim() || "",
          telefone: c.telefone?.trim() || "",
          email: c.email?.trim() || "",
        }))
        .filter(c => c.nome);

      const entrevistadoLegado = cleanContatos.map(c => c.nome).join(", ");

      const payload: PautaCreateInput = {
        ...formData,
        entrevistado: entrevistadoLegado,
        entrevistados_contatos: cleanContatos,
      };

      if (pauta) {
        console.log('[PautaTelejornalFormDialog] Atualizando pauta:', pauta.id);
        await updatePauta(pauta.id, payload);
        toast.success("Pauta atualizada com sucesso!");
      } else {
        console.log('[PautaTelejornalFormDialog] Criando nova pauta:', payload);
        const newPauta = await createPauta(payload, user.id);
        await linkPautaToTelejornal(newPauta.id, telejornalId);
        toast.success("Pauta criada e vinculada ao telejornal!");
      }

      // Salva contatos no diretório compartilhado (não bloqueante)
      upsertContatos(cleanContatos, user.id).catch(err =>
        console.error('[PautaTelejornalFormDialog] erro ao salvar contatos:', err)
      );

      onSuccess();
      onClose();
    } catch (error) {
      console.error("[PautaTelejornalFormDialog] Erro ao salvar pauta:", error);
      toast.error("Erro ao salvar pauta");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pauta ? "Editar Pauta" : "Nova Pauta"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="data_cobertura">Data de Cobertura</Label>
              <Input
                id="data_cobertura"
                type="date"
                value={formData.data_cobertura}
                onChange={(e) => setFormData({ ...formData, data_cobertura: e.target.value })}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="programa">Programa</Label>
              <Input
                id="programa"
                value={formData.programa}
                onChange={(e) => setFormData({ ...formData, programa: e.target.value })}
                placeholder="Nome do programa"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="titulo">Título (Retranca) *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Digite o título da pauta"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="produtor">Produtor</Label>
              <Input
                id="produtor"
                value={formData.produtor}
                onChange={(e) => setFormData({ ...formData, produtor: e.target.value })}
                placeholder="Nome do produtor"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="reporter">Repórter</Label>
              <Input
                id="reporter"
                value={formData.reporter}
                onChange={(e) => setFormData({ ...formData, reporter: e.target.value })}
                placeholder="Nome do repórter"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="descricao">Descrição</Label>
            <AutoTextarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição da pauta"
            />
          </div>

          <div className="space-y-1">
            <Label>Entrevistados</Label>
            <EntrevistadosField value={contatos} onChange={setContatos} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="proposta">Proposta</Label>
            <AutoTextarea
              id="proposta"
              value={formData.proposta}
              onChange={(e) => setFormData({ ...formData, proposta: e.target.value })}
              placeholder="Proposta da pauta"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="encaminhamento">Encaminhamento</Label>
            <AutoTextarea
              id="encaminhamento"
              value={formData.encaminhamento}
              onChange={(e) => setFormData({ ...formData, encaminhamento: e.target.value })}
              placeholder="Encaminhamento da pauta"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="informacoes">Informações Adicionais</Label>
            <AutoTextarea
              id="informacoes"
              value={formData.informacoes}
              onChange={(e) => setFormData({ ...formData, informacoes: e.target.value })}
              placeholder="Informações extras"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="local">Local</Label>
              <Input
                id="local"
                value={formData.local}
                onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                placeholder="Local da cobertura"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="horario">Horário</Label>
              <Input
                id="horario"
                type="time"
                value={formData.horario}
                onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="pt-3">
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
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : (pauta ? "Atualizar" : "Criar")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
