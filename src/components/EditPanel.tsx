import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Materia } from "@/types";
import { updateMateria } from "@/services/materias-api";
import { useToast } from "@/hooks/use-toast";

interface EditPanelProps {
  isOpen: boolean;
  onClose: () => void;
  item: Materia | null;
}

export const EditPanel = ({ isOpen, onClose, item }: EditPanelProps) => {
  const [activeTab, setActiveTab] = useState("editor");
  const [formData, setFormData] = useState<Partial<Materia>>({});
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      console.log("Initializing form data with item:", item);
      setFormData({
        retranca: item.retranca,
        clip: item.clip,
        duracao: item.duracao,
        reporter: item.reporter,
        status: item.status,
        cabeca: item.cabeca || '',
        texto: item.texto || '',
        local_gravacao: item.local_gravacao || '',
        pagina: item.pagina,
        bloco_id: item.bloco_id,
        ordem: item.ordem,
        tags: item.tags
      });
    }
  }, [item]);

  // Function to calculate duration based on word count
  const calculateDuration = (retranca: string, cabeca: string, texto: string) => {
    // Count words in each field
    const countWords = (text: string) => {
      return text ? text.trim().split(/\s+/).filter(word => word.length > 0).length : 0;
    };

    const retrancaWords = countWords(retranca);
    const cabecaWords = countWords(cabeca);
    const textoWords = countWords(texto);
    
    const totalWords = retrancaWords + cabecaWords + textoWords;
    
    // Estimate reading speed: approximately 150 words per minute for TV news
    // This translates to 2.5 words per second
    const wordsPerSecond = 2.5;
    const estimatedDuration = Math.round(totalWords / wordsPerSecond);
    
    return estimatedDuration > 0 ? estimatedDuration : 0;
  };

  // Update duration whenever text fields change
  useEffect(() => {
    const retranca = formData.retranca || '';
    const cabeca = formData.cabeca || '';
    const texto = formData.texto || '';
    
    const estimatedDuration = calculateDuration(retranca, cabeca, texto);
    
    // Only update if there's content and the duration has changed
    if ((retranca || cabeca || texto) && estimatedDuration !== formData.duracao) {
      setFormData(prev => ({
        ...prev,
        duracao: estimatedDuration
      }));
    }
  }, [formData.retranca, formData.cabeca, formData.texto]);

  if (!isOpen || !item) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: id === 'duracao' ? parseInt(value) || 0 : value
    }));
  };

  const handleSave = async () => {
    if (!item) return;
    
    const updateData = {
      ...formData,
      ordem: item.ordem,
      retranca: formData.retranca || item.retranca
    };
    
    setIsSaving(true);
    try {
      console.log("Saving updated materia:", { id: item.id, ...updateData });
      
      const updatedMateria = await updateMateria(item.id, updateData);
      
      toast({
        title: "Matéria atualizada",
        description: "As alterações foram salvas com sucesso.",
      });
      
      onClose();
    } catch (error) {
      console.error("Erro ao salvar matéria:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed top-0 right-0 w-[400px] h-full bg-white border-l border-gray-200 shadow-lg transition-transform duration-300 ease-in-out z-20 overflow-y-auto">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 flex justify-between items-center sticky top-0 z-10">
        <h3 className="font-medium">Editar: {item.retranca}</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Fechar
        </Button>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-gray-200 sticky top-14 bg-white z-10">
          <TabsList className="w-full">
            <TabsTrigger value="editor" className="w-1/2">Editor</TabsTrigger>
            <TabsTrigger value="teleprompter" className="w-1/2">Teleprompter</TabsTrigger>
          </TabsList>
        </div>
        
        {/* Editor Tab Content */}
        <TabsContent value="editor" className="p-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="retranca">Retranca</Label>
            <Input 
              id="retranca" 
              value={formData.retranca || ''} 
              onChange={handleInputChange}
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="cabeca">Cabeça (Teleprompter)</Label>
            <Textarea 
              id="cabeca" 
              rows={3} 
              value={formData.cabeca || ''} 
              onChange={handleInputChange} 
              placeholder="Texto da cabeça do VT que será lido pelo apresentador."
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="texto">Corpo da Matéria</Label>
            <Textarea 
              id="texto" 
              rows={10} 
              value={formData.texto || ''} 
              onChange={handleInputChange} 
              placeholder="Texto completo da matéria que será exibido no teleprompter."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="clip">Clipe</Label>
              <Input 
                id="clip" 
                value={formData.clip || ''} 
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duracao">Duração (segundos)</Label>
              <Input 
                id="duracao" 
                type="number" 
                value={formData.duracao || 0} 
                onChange={handleInputChange}
                title="Duração estimada automaticamente baseada na contagem de palavras"
              />
              <p className="text-xs text-gray-500">
                Estimativa automática baseada em {Math.round(((formData.retranca || '').split(/\s+/).filter(w => w).length + 
                (formData.cabeca || '').split(/\s+/).filter(w => w).length + 
                (formData.texto || '').split(/\s+/).filter(w => w).length))} palavras
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="reporter">Repórter</Label>
              <Input 
                id="reporter" 
                value={formData.reporter || ''} 
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <select 
                id="status" 
                className="w-full border border-gray-200 rounded-md p-2" 
                value={formData.status || 'draft'} 
                onChange={handleInputChange}
              >
                <option value="draft">Rascunho</option>
                <option value="pending">Pendente</option>
                <option value="published">Publicado</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="pagina">Página</Label>
            <Input 
              id="pagina" 
              value={formData.pagina || ''}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags SEO</Label>
            <Input 
              id="tags" 
              placeholder="Separe as tags por vírgulas"
              value={formData.tags?.join(', ') || ''} 
              onChange={(e) => {
                const tagsArray = e.target.value.split(',').map(tag => tag.trim());
                setFormData(prev => ({ ...prev, tags: tagsArray }));
              }}
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="local_gravacao">Local de Gravação</Label>
            <Input 
              id="local_gravacao" 
              placeholder="Ex: Centro da Cidade" 
              value={formData.local_gravacao || ''}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="space-y-1.5">
            <Label>Anexos</Label>
            <div className="border border-dashed border-gray-300 rounded-md p-8 text-center">
              <p className="text-sm text-gray-500 mb-2">Arraste arquivos ou clique para upload</p>
              <Button type="button" variant="outline" size="sm">Selecionar Arquivos</Button>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </TabsContent>
        
        {/* Teleprompter Tab Content */}
        <TabsContent value="teleprompter" className="p-4">
          <div className="teleprompter-text bg-black text-white p-6 rounded-md text-2xl space-y-8">
            <div className="mb-8">
              <h3 className="text-xl text-yellow-400 mb-3">CABEÇA:</h3>
              <p className="leading-relaxed">
                {formData.cabeca || "Nenhum texto de cabeça definido."}
              </p>
            </div>
            
            <div>
              <h3 className="text-xl text-yellow-400 mb-3">OFF:</h3>
              <p className="leading-relaxed">
                {formData.texto || "Nenhum texto de corpo definido."}
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
