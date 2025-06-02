
import { TabsContent } from "@/components/ui/tabs";
import { Materia } from "@/types";
import { EditorFormFields } from "./EditorFormFields";
import { EditorDurationField } from "./EditorDurationField";
import { EditorMetaFields } from "./EditorMetaFields";
import { EditorAttachments } from "./EditorAttachments";
import { EditorActions } from "./EditorActions";
import { validateTextLength, validateRequired, sanitizeFormData } from "@/utils/security-utils";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { canPerformAction } from "@/utils/security-utils";

interface EditorTabProps {
  formData: Partial<Materia>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onTagsChange: (tags: string[]) => void;
  onSave: () => void;
  onClose: () => void;
  isSaving: boolean;
  disabled?: boolean;
}

export const EditorTab = ({ 
  formData, 
  onInputChange, 
  onTagsChange, 
  onSave, 
  onClose, 
  isSaving,
  disabled = false
}: EditorTabProps) => {
  const { profile } = useAuth();

  // Enhanced save handler with authorization and validation
  const handleSecureSave = () => {
    // Check permissions
    const action = formData.id ? 'update' : 'create';
    if (!canPerformAction(profile, action, 'materia')) {
      toast({
        title: "Acesso negado",
        description: `Você não tem permissão para ${action === 'create' ? 'criar' : 'editar'} matérias.`,
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    if (!validateRequired(formData.retranca)) {
      toast({
        title: "Campo obrigatório",
        description: "O campo retranca é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    // Validate text lengths
    const validations = [
      { field: 'retranca', value: formData.retranca, maxLength: 200 },
      { field: 'clip', value: formData.clip, maxLength: 100 },
      { field: 'reporter', value: formData.reporter, maxLength: 100 },
      { field: 'pagina', value: formData.pagina, maxLength: 50 },
      { field: 'texto', value: formData.texto, maxLength: 5000 },
      { field: 'cabeca', value: formData.cabeca, maxLength: 5000 },
      { field: 'gc', value: formData.gc, maxLength: 5000 },
    ];

    for (const validation of validations) {
      if (validation.value && !validateTextLength(validation.value, validation.maxLength)) {
        toast({
          title: "Texto muito longo",
          description: `O campo ${validation.field} não pode ter mais de ${validation.maxLength} caracteres.`,
          variant: "destructive",
        });
        return;
      }
    }

    // Validate duration
    if (formData.duracao && (formData.duracao < 0 || formData.duracao > 3600)) {
      toast({
        title: "Duração inválida",
        description: "A duração deve estar entre 0 e 3600 segundos (1 hora).",
        variant: "destructive",
      });
      return;
    }

    onSave();
  };

  const isEditingDisabled = disabled || (!canPerformAction(profile, formData.id ? 'update' : 'create', 'materia'));

  return (
    <TabsContent value="editor" className="p-4 space-y-4">
      <EditorFormFields 
        formData={formData} 
        onInputChange={onInputChange}
        disabled={isEditingDisabled}
      />
      <EditorDurationField 
        formData={formData} 
        onInputChange={onInputChange}
        disabled={isEditingDisabled}
      />
      <EditorMetaFields 
        formData={formData} 
        onInputChange={onInputChange} 
        onTagsChange={onTagsChange}
        disabled={isEditingDisabled}
      />
      <EditorAttachments />
      <EditorActions 
        onSave={handleSecureSave} 
        onClose={onClose} 
        isSaving={isSaving}
        disabled={isEditingDisabled}
      />
    </TabsContent>
  );
};
