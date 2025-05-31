
import { useState, useEffect } from "react";
import { Materia } from "@/types";
import { updateMateria } from "@/services/materias-api";
import { useToast } from "@/hooks/use-toast";
import { EditPanelHeader } from "./edit-panel/EditPanelHeader";
import { EditPanelTabs } from "./edit-panel/EditPanelTabs";
import { useDurationCalculator } from "./edit-panel/DurationCalculator";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

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
  const { calculateCabecaDuration } = useDurationCalculator();

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
        gc: item.gc || '', // Include GC field
        texto: item.texto || '',
        local_gravacao: item.local_gravacao || '',
        pagina: item.pagina,
        bloco_id: item.bloco_id,
        ordem: item.ordem,
        tags: item.tags
      });
    }
  }, [item]);

  // Update duration whenever cabeca field changes (only based on cabeca words)
  useEffect(() => {
    const cabeca = formData.cabeca || '';
    
    const estimatedDuration = calculateCabecaDuration(cabeca);
    
    // Only update if there's content in cabeca and the duration has changed
    if (cabeca && estimatedDuration !== formData.duracao) {
      setFormData(prev => ({
        ...prev,
        duracao: estimatedDuration
      }));
    }
  }, [formData.cabeca, calculateCabecaDuration]);

  if (!isOpen || !item) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: id === 'duracao' ? parseInt(value) || 0 : value
    }));
  };

  const handleTagsChange = (tags: string[]) => {
    setFormData(prev => ({ ...prev, tags }));
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
    <div className="fixed top-0 right-0 w-[800px] h-full bg-white border-l border-gray-200 shadow-lg transition-transform duration-300 ease-in-out z-20">
      <EditPanelHeader item={item} onClose={onClose} />
      
      <ResizablePanelGroup direction="horizontal" className="h-[calc(100%-4rem)]">
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full overflow-y-auto">
            <EditPanelTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              formData={formData}
              onInputChange={handleInputChange}
              onTagsChange={handleTagsChange}
              onSave={handleSave}
              onClose={onClose}
              isSaving={isSaving}
            />
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full bg-gray-50 border-l border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4">Pré-visualização</h3>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-medium text-gray-700 mb-2">Retranca</h4>
                  <p className="text-sm text-gray-900">{formData.retranca || 'Não informado'}</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-medium text-gray-700 mb-2">Cabeça</h4>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{formData.cabeca || 'Não informado'}</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-medium text-gray-700 mb-2">GC</h4>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{formData.gc || 'Não informado'}</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-medium text-gray-700 mb-2">Corpo da Matéria</h4>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{formData.texto || 'Não informado'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium text-gray-700 mb-2">Duração</h4>
                    <p className="text-sm text-gray-900">{formData.duracao ? `${formData.duracao}s` : 'Não informado'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium text-gray-700 mb-2">Repórter</h4>
                    <p className="text-sm text-gray-900">{formData.reporter || 'Não informado'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
