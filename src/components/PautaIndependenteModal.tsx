import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AutoTextarea } from "@/components/ui/auto-textarea";
import { createPauta, updatePauta } from "@/services/pautas-api";
import { createMateria } from "@/services/materias-create";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { usePermissionGuard } from "@/hooks/usePermissionGuard";
import { Pauta, Telejornal, MateriaCreateInput, ContatoEntrevistado } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { FileOutput } from "lucide-react";
import { EntrevistadosField } from "@/components/telejornal-content/EntrevistadosField";
import { upsertContatos } from "@/services/contatos-entrevistados-api";
import { useAutosave } from "@/hooks/useAutosave";


interface PautaIndependenteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPautaCreated: () => void;
  pauta?: Pauta | null;
  selectedTelejornalId?: string | null;
  telejornais?: Telejornal[];
}

export const PautaIndependenteModal = ({
  isOpen,
  onClose,
  onPautaCreated,
  pauta,
  selectedTelejornalId,
  telejornais = []
}: PautaIndependenteModalProps) => {
  const [data, setData] = useState("");
  const [retranca, setRetranca] = useState("");
  const [programa, setPrograma] = useState("");
  const [produtor, setProdutor] = useState("");
  const [reporter, setReporter] = useState("");
  const [imagens, setImagens] = useState("");
  const [roteiro1, setRoteiro1] = useState("");
  const [contatos, setContatos] = useState<ContatoEntrevistado[]>([{ nome: "", telefone: "", email: "" }]);
  const [proposta, setProposta] = useState("");
  const [encaminhamento, setEncaminhamento] = useState("");
  const [informacoes, setInformacoes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingMateria, setIsGeneratingMateria] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { guardAction } = usePermissionGuard();

  // Check if selected telejornal has open espelho
  const selectedTelejornal = telejornais.find(t => t.id === selectedTelejornalId);
  const canGenerateMateria = pauta && selectedTelejornal?.espelho_aberto;

  // Load pauta data when editing
  useEffect(() => {
    if (pauta) {
      setData(pauta.data_cobertura || "");
      setRetranca(pauta.titulo || "");
      setPrograma(pauta.programa || "");
      setProdutor(pauta.produtor || "");
      setReporter(pauta.reporter || "");
      setImagens(pauta.local || "");
      setRoteiro1(pauta.descricao || "");
      if (pauta.entrevistados_contatos && pauta.entrevistados_contatos.length > 0) {
        setContatos(pauta.entrevistados_contatos);
      } else if (pauta.entrevistado?.trim()) {
        const nomes = pauta.entrevistado.split(/[,;\n]/).map(n => n.trim()).filter(Boolean);
        setContatos(nomes.length > 0 ? nomes.map(n => ({ nome: n, telefone: "", email: "" })) : [{ nome: "", telefone: "", email: "" }]);
      } else {
        setContatos([{ nome: "", telefone: "", email: "" }]);
      }
      setProposta(pauta.proposta || "");
      setEncaminhamento(pauta.encaminhamento || "");
      setInformacoes(pauta.informacoes || "");
    } else {
      // Reset form when creating new
      setData("");
      setRetranca("");
      setPrograma("");
      setProdutor("");
      setReporter("");
      setImagens("");
      setRoteiro1("");
      setContatos([{ nome: "", telefone: "", email: "" }]);
      setProposta("");
      setEncaminhamento("");
      setInformacoes("");
    }
  }, [pauta, isOpen]);

  const handleGenerateMateria = async () => {
    if (!pauta || !selectedTelejornalId) return;
    
    setIsGeneratingMateria(true);
    
    await guardAction('create', 'materia', async () => {
      // Fetch all blocks of the telejornal ordered by ordem descending to get the last block
      const { data: blocos, error: blocosError } = await supabase
        .from('blocos')
        .select('*')
        .eq('telejornal_id', selectedTelejornalId)
        .order('ordem', { ascending: false });
      
      if (blocosError || !blocos || blocos.length === 0) {
        toast({
          title: "Erro",
          description: "Não foi possível encontrar um bloco no espelho. Crie um bloco primeiro.",
          variant: "destructive"
        });
        return;
      }
      
      const lastBlock = blocos[0]; // Last block by ordem
      const allBlockIds = blocos.map(b => b.id);
      
      // Get max ordem and pagina across ALL blocks of this telejornal
      const { data: allMaterias } = await supabase
        .from('materias')
        .select('ordem, pagina')
        .in('bloco_id', allBlockIds);
      
      let maxOrdem = 0;
      let maxPagina = 0;
      
      if (allMaterias && allMaterias.length > 0) {
        maxOrdem = Math.max(...allMaterias.map(m => m.ordem || 0));
        maxPagina = Math.max(...allMaterias.map(m => {
          const pageNum = parseInt(m.pagina || '0');
          return isNaN(pageNum) ? 0 : pageNum;
        }));
      }
      
      const nextOrdem = maxOrdem + 1;
      const nextPagina = (maxPagina + 1).toString();
      
      // Build texto with all pauta details
      const textoCompleto = [
        roteiro1 && `📝 ROTEIRO:\n${roteiro1}`,
        proposta && `📌 PROPOSTA:\n${proposta}`,
        contatos.filter(c => c.nome?.trim()).length > 0 && `🎤 ENTREVISTADOS:\n${contatos.filter(c => c.nome?.trim()).map(c => [c.nome?.trim(), c.telefone?.trim(), c.email?.trim()].filter(Boolean).join(' · ')).join('\n')}`,
        encaminhamento && `➡️ ENCAMINHAMENTO:\n${encaminhamento}`,
        informacoes && `ℹ️ INFORMAÇÕES:\n${informacoes}`,
        produtor && `👤 PRODUTOR: ${produtor}`,
        programa && `📺 PROGRAMA: ${programa}`,
        data && `📅 DATA: ${data}`,
        imagens && `🖼️ IMAGENS: ${imagens}`,
      ].filter(Boolean).join('\n\n');
      
      const materiaData: MateriaCreateInput = {
        bloco_id: lastBlock.id,
        retranca: retranca || pauta.titulo,
        reporter: reporter || '',
        local_gravacao: imagens || '',
        texto: textoCompleto,
        cabeca: '', // Empty to not appear in teleprompter
        tipo_material: 'PAUTA',
        status: 'draft', // Draft so it doesn't go to teleprompter
        duracao: 0,
        ordem: nextOrdem,
        pagina: nextPagina,
      };
      
      await createMateria(materiaData);
      
      toast({
        title: "Matéria gerada!",
        description: `Matéria "${retranca}" criada no ${lastBlock.nome} (página ${nextPagina}) com status rascunho.`,
      });
      
      onPautaCreated();
      handleClose();
    });
    
    setIsGeneratingMateria(false);
  };

  const getCleanContatos = () =>
    contatos
      .map(c => ({
        nome: c.nome?.trim() || "",
        telefone: c.telefone?.trim() || "",
        email: c.email?.trim() || "",
      }))
      .filter(c => c.nome);

  const buildPautaData = () => {
    const cleanContatos = getCleanContatos();
    return {
      titulo: retranca,
      descricao: roteiro1,
      local: imagens,
      horario: data,
      entrevistado: cleanContatos.map(c => c.nome).join(", "),
      entrevistados_contatos: cleanContatos,
      produtor,
      proposta,
      encaminhamento,
      informacoes,
      status: pauta?.status || "pendente",
      data_cobertura: data,
      programa,
      reporter
    };
  };

  const autosaveEnabled = isOpen && !!pauta?.id && !!retranca.trim() && !isSubmitting;

  const { isAutosaving, lastSavedAt, markSaved } = useAutosave({
    data: { retranca, roteiro1, imagens, data, contatos, produtor, proposta, encaminhamento, informacoes, programa, reporter },
    enabled: autosaveEnabled,
    onSave: async () => {
      if (!pauta?.id) return;
      await updatePauta(pauta.id, buildPautaData());
      onPautaCreated();
    },
  });

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
    
    const actionType = pauta ? 'update' : 'create';
    
    const cleanContatos = getCleanContatos();

    await guardAction(actionType, 'pauta', async () => {
      const pautaData = buildPautaData();


      if (pauta) {
        console.log('[PautaIndependenteModal] Atualizando pauta:', pauta.id, pautaData);
        await updatePauta(pauta.id, pautaData);
        toast({
          title: "Sucesso!",
          description: "Pauta atualizada com sucesso.",
        });
      } else {
        console.log('[PautaIndependenteModal] Criando pauta independente:', pautaData);
        await createPauta(pautaData, user.id);
        toast({
          title: "Sucesso!",
          description: "Pauta criada com sucesso.",
        });
      }
      
      // Salva contatos na agenda da produção (não bloqueante)
      upsertContatos(cleanContatos, user.id).catch(err =>
        console.error('[PautaIndependenteModal] erro ao salvar contatos:', err)
      );

      markSaved();
      onPautaCreated();

      handleClose();
    }, pauta?.user_id);
    
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
    setContatos([{ nome: "", telefone: "", email: "" }]);
    setProposta("");
    setEncaminhamento("");
    setInformacoes("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pauta ? "Editar Pauta" : "Nova Pauta Independente"}</DialogTitle>
          {autosaveEnabled && (
            <p className="text-xs text-muted-foreground">
              {isAutosaving
                ? "Salvando..."
                : lastSavedAt
                  ? `Salvo automaticamente às ${lastSavedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                  : "Salvamento automático ativo"}
            </p>
          )}
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
            <Label>ENTREVISTADOS</Label>
            <EntrevistadosField value={contatos} onChange={setContatos} />
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
          
          <DialogFooter className="pt-3 flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting || isGeneratingMateria}>
              Cancelar
            </Button>
            
            {canGenerateMateria && (
              <Button 
                type="button" 
                variant="secondary"
                onClick={handleGenerateMateria}
                disabled={isSubmitting || isGeneratingMateria || !retranca.trim()}
              >
                <FileOutput className="h-4 w-4 mr-2" />
                {isGeneratingMateria ? "Gerando..." : "Gerar Matéria"}
              </Button>
            )}
            
            <Button type="submit" disabled={isSubmitting || isGeneratingMateria || !retranca.trim()}>
              {isSubmitting ? "Salvando..." : pauta ? "Atualizar Pauta" : "Salvar Pauta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
