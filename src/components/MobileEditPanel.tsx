import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Materia } from "@/types";
import { updateMateria } from "@/services/materias-api";
import { useToast } from "@/hooks/use-toast";
import { EditPanelHeader } from "./edit-panel/EditPanelHeader";
import { EditPanelTabs } from "./edit-panel/EditPanelTabs";
import { useDurationCalculator } from "./edit-panel/DurationCalculator";
import { useMateriaLock } from "@/hooks/useMateriaLock";

interface MobileEditPanelProps {
  isOpen: boolean;
  onClose: () => void;
  item: Materia | null;
  title?: string;
}

export const MobileEditPanel = ({ isOpen, onClose, item, title }: MobileEditPanelProps) => {
  const [activeTab, setActiveTab] = useState("editor");
  const [formData, setFormData] = useState<Partial<Materia>>({});
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { calculateCabecaDuration } = useDurationCalculator();
  
  // Hook para gerenciar o lock da matéria
  const { canEdit } = useMateriaLock({
    materiaId: item?.id || null,
    isOpen: isOpen,
    onClose
  });

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
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

  // Update duration whenever cabeca field changes
  useEffect(() => {
    const cabeca = formData.cabeca || '';
    const estimatedDuration = calculateCabecaDuration(cabeca);
    
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
      await updateMateria(item.id, updateData);
      onClose();
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const panelContent = (
    <div className={`mobile-edit-panel ${isOpen ? 'open' : ''} md:hidden flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {title && (
            <h2 className="text-lg font-semibold">{title}</h2>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="p-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="edit-panel-content">
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
      </div>
    </div>
  );

  return createPortal(panelContent, document.body);
};