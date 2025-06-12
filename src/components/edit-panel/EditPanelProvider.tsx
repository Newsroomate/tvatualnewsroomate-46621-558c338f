
import { useState, useEffect } from "react";
import { Materia } from "@/types";
import { updateMateria } from "@/services/materias-api";
import { useToast } from "@/hooks/use-toast";
import { EditPanelHeader } from "./EditPanelHeader";
import { EditPanelTabs } from "./EditPanelTabs";
import { useDurationCalculator } from "./DurationCalculator";
import { useMateriaLock } from "@/hooks/useMateriaLock";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

interface EditPanelProviderProps {
  item: Materia;
  onClose: () => void;
}

export const EditPanelProvider = ({ item, onClose }: EditPanelProviderProps) => {
  const [activeTab, setActiveTab] = useState("editor");
  const [formData, setFormData] = useState<Partial<Materia>>({});
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { calculateCabecaDuration } = useDurationCalculator();
  
  // Hook para gerenciar o lock da matéria (agora sem loading state)
  const { canEdit } = useMateriaLock({
    materiaId: item?.id || null,
    isOpen: true,
    onClose
  });

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      console.log("Initializing form data with item:", item);
      setFormData({
        retranca: item.retranca,
        clip: item.clip,
        tempo_clip: item.tempo_clip,
        duracao: item.duracao,
        reporter: item.reporter,
        status: item.status,
        cabeca: item.cabeca || '',
        gc: item.gc || '',
        texto: item.texto || '',
        local_gravacao: item.local_gravacao || '',
        pagina: item.pagina,
        bloco_id: item.bloco_id,
        ordem: item.ordem,
        tags: item.tags,
        tipo_material: item.tipo_material
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!canEdit) return;
    
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: id === 'duracao' ? parseInt(value) || 0 : value
    }));
  };

  const handleTagsChange = (tags: string[]) => {
    if (!canEdit) return;
    setFormData(prev => ({ ...prev, tags }));
  };

  const handleSave = async () => {
    if (!item || !canEdit) return;
    
    // Create clean update data without undefined properties
    const updateData: Partial<Materia> = {
      retranca: formData.retranca || item.retranca,
      clip: formData.clip,
      tempo_clip: formData.tempo_clip,
      duracao: formData.duracao,
      reporter: formData.reporter,
      status: formData.status,
      cabeca: formData.cabeca,
      gc: formData.gc,
      texto: formData.texto,
      local_gravacao: formData.local_gravacao,
      pagina: formData.pagina,
      tags: formData.tags,
      tipo_material: formData.tipo_material,
      ordem: item.ordem,
      bloco_id: formData.bloco_id
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

  // Prevent keyboard shortcuts from interfering with text editing
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user is editing text in the edit panel
      const activeElement = document.activeElement as HTMLElement;
      const isEditingInPanel = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        (activeElement as any).contentEditable === 'true'
      ) && activeElement.closest('.edit-panel-content');

      // If editing text in panel, allow normal paste behavior
      if (isEditingInPanel && event.ctrlKey && event.key === 'v') {
        // Don't prevent default - allow normal paste
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true); // Use capture phase
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-full z-20 pointer-events-none">
      <ResizablePanelGroup direction="horizontal" className="w-full h-full pointer-events-auto">
        {/* Invisible left panel that represents the main content area */}
        <ResizablePanel 
          defaultSize={60} 
          minSize={30}
          className="pointer-events-none"
        />
        
        {/* Resizable handle */}
        <ResizableHandle withHandle className="w-2 bg-gray-300 hover:bg-gray-400 transition-colors pointer-events-auto" />
        
        {/* Modal panel on the right */}
        <ResizablePanel 
          defaultSize={40} 
          minSize={25}
          maxSize={70}
          className="pointer-events-auto"
        >
          <div className="w-full h-full bg-white border-l border-gray-200 shadow-lg overflow-y-auto edit-panel-content">
            <EditPanelHeader 
              item={item} 
              onClose={onClose}
              onSave={canEdit ? handleSave : undefined}
              isSaving={isSaving}
            />
            
            {canEdit && (
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
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
