
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { Materia } from "@/types";
import { updateMateria } from "@/services/materias-api";
import { useToast } from "@/hooks/use-toast";
import { FormFields } from "./FormFields";

interface EditorTabProps {
  active: boolean;
  formData: Partial<Materia>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Materia>>>;
  isSaving: boolean;
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
  item: Materia;
  onClose: () => void;
}

export const EditorTab = ({ 
  active, 
  formData, 
  setFormData, 
  isSaving, 
  setIsSaving, 
  item, 
  onClose
}: EditorTabProps) => {
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: id === 'duracao' ? parseInt(value) || 0 : value
    }));
  };

  const handleSave = async () => {
    if (!item) return;
    
    // Make sure ordem and retranca are included in the update data
    const updateData = {
      ...formData,
      ordem: item.ordem, // Ensure ordem is always included and maintains its original value
      retranca: formData.retranca || item.retranca // Ensure retranca is always included
    };
    
    setIsSaving(true);
    try {
      console.log("Saving updated materia:", { id: item.id, ...updateData });
      
      // Update the materia in the database
      const updatedMateria = await updateMateria(item.id, updateData);
      
      // Show success toast
      toast({
        title: "Matéria atualizada",
        description: "As alterações foram salvas com sucesso.",
      });
      
      // Force close the edit panel immediately after saving
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
    <TabsContent value="editor" className="p-4 space-y-4">
      <FormFields 
        formData={formData} 
        setFormData={setFormData} 
        handleInputChange={handleInputChange} 
      />
      
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
  );
};
