
import { useState, useEffect, useRef } from "react";
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
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const panelRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { calculateCabecaDuration } = useDurationCalculator();

  // Center the modal when it opens
  useEffect(() => {
    if (isOpen) {
      const centerX = (window.innerWidth - dimensions.width) / 2;
      const centerY = (window.innerHeight - dimensions.height) / 2;
      setPosition({ x: Math.max(0, centerX), y: Math.max(0, centerY) });
    }
  }, [isOpen, dimensions.width, dimensions.height]);

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
        gc: item.gc || '',
        texto: item.texto || '',
        local_gravacao: item.local_gravacao || '',
        pagina: item.pagina,
        bloco_id: item.bloco_id,
        ordem: item.ordem,
        tags: item.tags
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

  const handleMouseDown = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeDirection(direction);
  };

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.drag-handle')) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing && panelRef.current) {
        const rect = panelRef.current.getBoundingClientRect();
        let newWidth = dimensions.width;
        let newHeight = dimensions.height;
        let newX = position.x;
        let newY = position.y;

        if (resizeDirection.includes('right')) {
          newWidth = Math.max(400, e.clientX - rect.left);
        }
        if (resizeDirection.includes('left')) {
          const deltaX = rect.left - e.clientX;
          newWidth = Math.max(400, dimensions.width + deltaX);
          newX = Math.min(position.x, e.clientX);
        }
        if (resizeDirection.includes('bottom')) {
          newHeight = Math.max(300, e.clientY - rect.top);
        }
        if (resizeDirection.includes('top')) {
          const deltaY = rect.top - e.clientY;
          newHeight = Math.max(300, dimensions.height + deltaY);
          newY = Math.min(position.y, e.clientY);
        }

        setDimensions({ width: newWidth, height: newHeight });
        setPosition({ x: newX, y: newY });
      }

      if (isDragging) {
        const newX = Math.max(0, Math.min(window.innerWidth - dimensions.width, e.clientX - dragStart.x));
        const newY = Math.max(0, Math.min(window.innerHeight - dimensions.height, e.clientY - dragStart.y));
        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection('');
      setIsDragging(false);
    };

    if (isResizing || isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, isDragging, resizeDirection, position, dimensions, dragStart]);

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
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      
      {/* Resizable Modal */}
      <div
        ref={panelRef}
        className="fixed bg-white border border-gray-300 shadow-2xl z-50 overflow-hidden"
        style={{
          left: position.x,
          top: position.y,
          width: dimensions.width,
          height: dimensions.height,
          cursor: isDragging ? 'grabbing' : 'auto'
        }}
      >
        {/* Resize handles */}
        <div
          className="absolute top-0 left-0 w-2 h-full cursor-w-resize hover:bg-blue-200 opacity-0 hover:opacity-50"
          onMouseDown={(e) => handleMouseDown(e, 'left')}
        />
        <div
          className="absolute top-0 right-0 w-2 h-full cursor-e-resize hover:bg-blue-200 opacity-0 hover:opacity-50"
          onMouseDown={(e) => handleMouseDown(e, 'right')}
        />
        <div
          className="absolute top-0 left-0 w-full h-2 cursor-n-resize hover:bg-blue-200 opacity-0 hover:opacity-50"
          onMouseDown={(e) => handleMouseDown(e, 'top')}
        />
        <div
          className="absolute bottom-0 left-0 w-full h-2 cursor-s-resize hover:bg-blue-200 opacity-0 hover:opacity-50"
          onMouseDown={(e) => handleMouseDown(e, 'bottom')}
        />
        <div
          className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize hover:bg-blue-200 opacity-0 hover:opacity-50"
          onMouseDown={(e) => handleMouseDown(e, 'top-left')}
        />
        <div
          className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize hover:bg-blue-200 opacity-0 hover:opacity-50"
          onMouseDown={(e) => handleMouseDown(e, 'top-right')}
        />
        <div
          className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize hover:bg-blue-200 opacity-0 hover:opacity-50"
          onMouseDown={(e) => handleMouseDown(e, 'bottom-left')}
        />
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize hover:bg-blue-200 opacity-0 hover:opacity-50"
          onMouseDown={(e) => handleMouseDown(e, 'bottom-right')}
        />

        {/* Content */}
        <div className="h-full flex flex-col">
          <div 
            className="drag-handle cursor-grab active:cursor-grabbing"
            onMouseDown={handleHeaderMouseDown}
          >
            <EditPanelHeader item={item} onClose={onClose} />
          </div>
          
          <div className="flex-1 overflow-hidden">
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
        </div>
      </div>
    </>
  );
};
