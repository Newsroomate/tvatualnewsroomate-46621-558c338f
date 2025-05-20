
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Materia } from "@/types";
import { updateMateria } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
interface EditPanelProps {
  isOpen: boolean;
  onClose: () => void;
  item: Materia | null;
}
export const EditPanel = ({
  isOpen,
  onClose,
  item
}: EditPanelProps) => {
  const [activeTab, setActiveTab] = useState("editor");
  const [formData, setFormData] = useState<Partial<Materia>>({});
  const [isSaving, setIsSaving] = useState(false);
  const {
    toast
  } = useToast();

  // Inicializa os dados do formulário quando o item muda
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
        tags: item.tags,
        equipamento: item.equipamento || '',
        horario_exibicao: item.horario_exibicao || '',
      });
    }
  }, [item]);
  if (!isOpen || !item) return null;
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const {
      id,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: id === 'duracao' ? parseInt(value) || 0 : value
    }));
  };
  const handleSave = async () => {
    if (!item) return;
    setIsSaving(true);
    try {
      console.log("Saving updated materia:", {
        id: item.id,
        ...formData
      });

      // Update the materia in the database
      const updatedMateria = await updateMateria(item.id, formData);

      // Show success toast
      toast({
        title: "Matéria atualizada",
        description: "As alterações foram salvas com sucesso."
      });

      // Force close the edit panel immediately after saving
      onClose();
    } catch (error) {
      console.error("Erro ao salvar matéria:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  return <div className="fixed top-0 right-0 w-[400px] h-full bg-white border-l border-gray-200 shadow-lg transition-transform duration-300 ease-in-out z-20 overflow-y-auto">
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
            <Input id="retranca" value={formData.retranca || ''} onChange={handleInputChange} />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="cabeca">Cabeça (Teleprompter)</Label>
            <Textarea id="cabeca" rows={3} value={formData.cabeca || ''} onChange={handleInputChange} placeholder="Texto da cabeça do VT que será lido pelo apresentador." />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="texto">Corpo da Matéria</Label>
            <Textarea id="texto" rows={10} value={formData.texto || ''} onChange={handleInputChange} placeholder="Texto completo da matéria que será exibido no teleprompter." />
          </div>
          
          {/* Novos campos adicionados aqui */}
          <div className="space-y-4 border rounded-md p-4 bg-gray-50">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Metadados da Matéria</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="reporter">Repórter</Label>
                <Input id="reporter" value={formData.reporter || ''} onChange={handleInputChange} />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="editor">Editor</Label>
                <Input id="editor" value={formData.editor || ''} onChange={handleInputChange} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="local_gravacao">Local de Gravação</Label>
                <Input 
                  id="local_gravacao" 
                  value={formData.local_gravacao || ''} 
                  onChange={handleInputChange}
                  placeholder="Ex: Estúdio, Externa"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="equipamento">Equipamento</Label>
                <Input 
                  id="equipamento" 
                  value={formData.equipamento || ''} 
                  onChange={handleInputChange}
                  placeholder="Câmera, microfone, etc."
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="horario_exibicao">Horário de Exibição</Label>
              <Input 
                id="horario_exibicao" 
                type="datetime-local" 
                value={formData.horario_exibicao ? new Date(formData.horario_exibicao).toISOString().slice(0, 16) : ''} 
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="tags">Tags SEO (separadas por vírgula)</Label>
              <Input 
                id="tags" 
                value={Array.isArray(formData.tags) ? formData.tags.join(', ') : ''} 
                onChange={(e) => {
                  const tagsArray = e.target.value.split(',').map(tag => tag.trim());
                  setFormData(prev => ({...prev, tags: tagsArray}));
                }}
                placeholder="Ex: política, economia, cultura"
              />
            </div>
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
    </div>;
};
