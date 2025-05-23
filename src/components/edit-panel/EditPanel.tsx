
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Materia } from "@/types";
import { EditorTab } from "./EditorTab";
import { TeleprompterTab } from "./TeleprompterTab";

interface EditPanelProps {
  isOpen: boolean;
  onClose: () => void;
  item: Materia | null;
}

export const EditPanel = ({ isOpen, onClose, item }: EditPanelProps) => {
  const [activeTab, setActiveTab] = useState("editor");
  const [formData, setFormData] = useState<Partial<Materia>>({});
  const [isSaving, setIsSaving] = useState(false);

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

  if (!isOpen || !item) return null;

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
        
        <EditorTab 
          active={activeTab === "editor"}
          formData={formData}
          setFormData={setFormData}
          isSaving={isSaving}
          setIsSaving={setIsSaving}
          item={item}
          onClose={onClose}
        />
        
        <TeleprompterTab 
          active={activeTab === "teleprompter"}
          cabeca={formData.cabeca || ""}
          texto={formData.texto || ""}
        />
      </Tabs>
    </div>
  );
};
