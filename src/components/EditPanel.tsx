
import { useState, useEffect } from "react";
import { Materia } from "@/types";
import { updateMateria } from "@/services/materias-api";
import { useToast } from "@/hooks/use-toast";
import { EditPanelHeader } from "./edit-panel/EditPanelHeader";
import { EditPanelTabs } from "./edit-panel/EditPanelTabs";
import { useDurationCalculator } from "./edit-panel/DurationCalculator";

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
  const { calculateDuration } = useDurationCalculator();

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
  }, [formData.retranca, formData.cabeca, formData.texto, calculateDuration]);

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
    <div className="fixed top-0 right-0 w-[400px] h-full bg-white border-l border-gray-200 shadow-lg transition-transform duration-300 ease-in-out z-20 overflow-y-auto">
      <EditPanelHeader item={item} onClose={onClose} />
      
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
  );
};
