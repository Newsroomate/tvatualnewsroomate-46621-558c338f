import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AutoTextarea } from "@/components/ui/auto-textarea";
import { Card, CardContent } from "@/components/ui/card";
import { createPauta, updatePauta } from "@/services/pautas-api";
import { createMateria } from "@/services/materias-create";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { usePermissionGuard } from "@/hooks/usePermissionGuard";
import { Pauta, Telejornal, MateriaCreateInput } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, FileOutput, Save } from "lucide-react";

interface PautaEditorViewProps {
  pauta: Pauta | null;
  onClose: () => void;
  onSave: () => void;
  selectedTelejornalId?: string | null;
  telejornais?: Telejornal[];
}

export const PautaEditorView = ({
  pauta,
  onClose,
  onSave,
  selectedTelejornalId,
  telejornais = []
}: PautaEditorViewProps) => {
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
      setEntrevistados(pauta.entrevistado || "");
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
      setEntrevistados("");
      setProposta("");
      setEncaminhamento("");
      setInformacoes("");
    }
  }, [pauta]);

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
      
      const lastBlock = blocos[0];
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
        entrevistados && `🎤 ENTREVISTADOS:\n${entrevistados}`,
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
        cabeca: '',
        tipo_material: 'PAUTA',
        status: 'draft',
        duracao: 0,
        ordem: nextOrdem,
        pagina: nextPagina,
      };
      
      await createMateria(materiaData);
      
      toast({
        title: "Matéria gerada!",
        description: `Matéria "${retranca}" criada no ${lastBlock.nome} (página ${nextPagina}) com status rascunho.`,
      });
      
      onSave();
      onClose();
    });
    
    setIsGeneratingMateria(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!retranca.trim()) return;
    
    if (!user || !user.id) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para criar uma pauta.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    const actionType = pauta ? 'update' : 'create';
    
    await guardAction(actionType, 'pauta', async () => {
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
        status: pauta?.status || "pendente",
        data_cobertura: data,
        programa,
        reporter
      };

      if (pauta) {
        await updatePauta(pauta.id, pautaData);
        toast({
          title: "Sucesso!",
          description: "Pauta atualizada com sucesso.",
        });
      } else {
        await createPauta(pautaData, user.id);
        toast({
          title: "Sucesso!",
          description: "Pauta criada com sucesso.",
        });
      }
      
      onSave();
      onClose();
    }, pauta?.user_id);
    
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="bg-muted px-6 py-4 border-b flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onClose} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Espelho
          </Button>
          <div className="h-6 w-px bg-border" />
          <h1 className="text-lg font-semibold">
            {pauta ? "Editar Pauta" : "Nova Pauta"}
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          {canGenerateMateria && (
            <Button 
              variant="secondary"
              onClick={handleGenerateMateria}
              disabled={isSubmitting || isGeneratingMateria || !retranca.trim()}
              className="gap-2"
            >
              <FileOutput className="h-4 w-4" />
              {isGeneratingMateria ? "Gerando..." : "Gerar Matéria"}
            </Button>
          )}
          
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || isGeneratingMateria || !retranca.trim()}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? "Salvando..." : pauta ? "Atualizar" : "Salvar"}
          </Button>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <Card className="max-w-5xl mx-auto">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Row 1: Data, Imagens, Programa */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data" className="text-sm font-medium">DATA</Label>
                  <Input 
                    id="data" 
                    type="date" 
                    value={data} 
                    onChange={e => setData(e.target.value)} 
                    required 
                    className="h-10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="imagens" className="text-sm font-medium">IMAGENS</Label>
                  <Input 
                    id="imagens" 
                    value={imagens} 
                    onChange={e => setImagens(e.target.value)} 
                    placeholder="Informações sobre imagens" 
                    className="h-10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="programa" className="text-sm font-medium">PROGRAMA</Label>
                  <Input 
                    id="programa" 
                    value={programa} 
                    onChange={e => setPrograma(e.target.value)} 
                    placeholder="Nome do programa" 
                    className="h-10"
                  />
                </div>
              </div>
              
              {/* Row 2: Retranca */}
              <div className="space-y-2">
                <Label htmlFor="retranca" className="text-sm font-medium">RETRANCA *</Label>
                <Input 
                  id="retranca" 
                  value={retranca} 
                  onChange={e => setRetranca(e.target.value)} 
                  placeholder="Digite a retranca" 
                  required 
                  className="h-12 text-lg font-medium"
                />
              </div>

              {/* Row 3: Produtor, Repórter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="produtor" className="text-sm font-medium">PRODUTOR</Label>
                  <Input 
                    id="produtor" 
                    value={produtor} 
                    onChange={e => setProdutor(e.target.value)} 
                    placeholder="Nome do produtor" 
                    className="h-10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reporter" className="text-sm font-medium">REPÓRTER</Label>
                  <Input 
                    id="reporter" 
                    value={reporter} 
                    onChange={e => setReporter(e.target.value)} 
                    placeholder="Nome do repórter" 
                    className="h-10"
                  />
                </div>
              </div>

              {/* Row 4: Roteiro 1 */}
              <div className="space-y-2">
                <Label htmlFor="roteiro1" className="text-sm font-medium">ROTEIRO 1</Label>
                <AutoTextarea 
                  id="roteiro1" 
                  value={roteiro1} 
                  onChange={e => setRoteiro1(e.target.value)} 
                  placeholder="Conteúdo do roteiro" 
                  className="min-h-[120px]"
                />
              </div>

              {/* Row 5: Entrevistados */}
              <div className="space-y-2">
                <Label htmlFor="entrevistados" className="text-sm font-medium">ENTREVISTADOS</Label>
                <AutoTextarea 
                  id="entrevistados" 
                  value={entrevistados} 
                  onChange={e => setEntrevistados(e.target.value)} 
                  placeholder="Lista de entrevistados" 
                  className="min-h-[80px]"
                />
              </div>

              {/* Row 6: Proposta */}
              <div className="space-y-2">
                <Label htmlFor="proposta" className="text-sm font-medium">PROPOSTA</Label>
                <AutoTextarea 
                  id="proposta" 
                  value={proposta} 
                  onChange={e => setProposta(e.target.value)} 
                  placeholder="Descrição da proposta" 
                  className="min-h-[100px]"
                />
              </div>
              
              {/* Row 7: Encaminhamento */}
              <div className="space-y-2">
                <Label htmlFor="encaminhamento" className="text-sm font-medium">ENCAMINHAMENTO</Label>
                <AutoTextarea 
                  id="encaminhamento" 
                  value={encaminhamento} 
                  onChange={e => setEncaminhamento(e.target.value)} 
                  placeholder="Encaminhamento da pauta" 
                  className="min-h-[80px]"
                />
              </div>

              {/* Row 8: Informações */}
              <div className="space-y-2">
                <Label htmlFor="informacoes" className="text-sm font-medium">INFORMAÇÕES</Label>
                <AutoTextarea 
                  id="informacoes" 
                  value={informacoes} 
                  onChange={e => setInformacoes(e.target.value)} 
                  placeholder="Informações adicionais" 
                  className="min-h-[80px]"
                />
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
