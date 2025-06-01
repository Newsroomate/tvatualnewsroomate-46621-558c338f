
import { TabsContent } from "@/components/ui/tabs";
import { Materia } from "@/types";
import { EditorFormFields } from "./EditorFormFields";
import { EditorDurationField } from "./EditorDurationField";
import { EditorMetaFields } from "./EditorMetaFields";
import { EditorAttachments } from "./EditorAttachments";
import { EditorActions } from "./EditorActions";

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
  return (
    <TabsContent value="editor" className="p-4 space-y-4">
      <EditorFormFields 
        formData={formData} 
        onInputChange={onInputChange}
        disabled={disabled}
      />
      <EditorDurationField 
        formData={formData} 
        onInputChange={onInputChange}
        disabled={disabled}
      />
      <EditorMetaFields 
        formData={formData} 
        onInputChange={onInputChange} 
        onTagsChange={onTagsChange}
        disabled={disabled}
      />
      <EditorAttachments />
      <EditorActions 
        onSave={onSave} 
        onClose={onClose} 
        isSaving={isSaving}
        disabled={disabled}
      />
    </TabsContent>
  );
};
