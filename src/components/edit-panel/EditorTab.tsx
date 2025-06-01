
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

  // Enhanced input change handler with validation
  const handleSecureInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Validate input length based on field
    let maxLength = 1000; // default
    switch (name) {
      case 'retranca':
        maxLength = 200;
        break;
      case 'clip':
        maxLength = 100;
        break;
      case 'reporter':
        maxLength = 100;
        break;
      case 'pagina':
        maxLength = 50;
        break;
      case 'texto':
      case 'cabeca':
        maxLength = 5000;
        break;
    }

    if (!validateTextLength(value, maxLength)) {
      toast({
        title: "Texto muito longo",
        description: `O campo ${name} não pode ter mais de ${maxLength} caracteres.`,
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    if (name === 'retranca' && !validateRequired(value)) {
      toast({
        title: "Campo obrigatório",
        description: "O campo retranca é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    // Create sanitized event
    const sanitizedEvent = {
      ...e,
      target: {
        ...e.target,
        value: value.trim() // Basic sanitization - trim whitespace
      }
    };

    onInputChange(sanitizedEvent);
  };

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
        onInputChange={handleSecureInputChange}
        disabled={isEditingDisabled}
      />
      <EditorDurationField 
        formData={formData} 
        onInputChange={handleSecureInputChange}
        disabled={isEditingDisabled}
      />
      <EditorMetaFields 
        formData={formData} 
        onInputChange={handleSecureInputChange} 
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
