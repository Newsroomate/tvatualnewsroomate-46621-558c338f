
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Materia } from "@/types";
import { AllCapsGCButton } from "./AllCapsGCButton";
import { useRef } from "react";

interface EditorFormFieldsProps {
  formData: Partial<Materia>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  disabled?: boolean;
}

export const EditorFormFields = ({
  formData,
  onInputChange,
  disabled = false
}: EditorFormFieldsProps) => {
  const gcTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleGCTextChange = (newText: string) => {
    // Create a synthetic event to maintain compatibility with onInputChange
    const syntheticEvent = {
      target: {
        id: 'gc',
        value: newText
      }
    } as React.ChangeEvent<HTMLTextAreaElement>;
    
    onInputChange(syntheticEvent);
  };

  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="retranca">Retranca</Label>
        <Input 
          id="retranca" 
          value={formData.retranca || ''} 
          onChange={onInputChange}
          disabled={disabled}
        />
      </div>
      
      <div className="space-y-1.5">
        <Label htmlFor="cabeca">Cabeça</Label>
        <Textarea 
          id="cabeca" 
          rows={3} 
          value={formData.cabeca || ''} 
          onChange={onInputChange} 
          placeholder="Texto da cabeça do VT que será lido pelo apresentador."
          disabled={disabled}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <Label htmlFor="gc">GC (Gerador de Caracteres)</Label>
          <AllCapsGCButton 
            textareaRef={gcTextareaRef}
            onTextChange={handleGCTextChange}
          />
        </div>
        <Textarea 
          ref={gcTextareaRef}
          id="gc" 
          rows={4} 
          value={formData.gc || ''} 
          onChange={onInputChange} 
          placeholder="Texto do GC que será exibido na tela durante a matéria."
          disabled={disabled}
        />
      </div>
      
      <div className="space-y-1.5">
        <Label htmlFor="texto">Corpo da Matéria</Label>
        <Textarea 
          id="texto" 
          rows={10} 
          value={formData.texto || ''} 
          onChange={onInputChange} 
          placeholder="Texto completo da matéria."
          disabled={disabled}
        />
      </div>
    </>
  );
};
