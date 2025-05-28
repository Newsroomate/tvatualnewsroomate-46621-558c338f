
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Materia } from "@/types";
import { ExportGCButton } from "./ExportGCButton";

interface EditorFormFieldsProps {
  formData: Partial<Materia>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const EditorFormFields = ({ formData, onInputChange }: EditorFormFieldsProps) => {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="retranca">Retranca</Label>
        <Input 
          id="retranca" 
          value={formData.retranca || ''} 
          onChange={onInputChange}
        />
      </div>
      
      <div className="space-y-1.5">
        <Label htmlFor="cabeca">Cabeça (Teleprompter)</Label>
        <Textarea 
          id="cabeca" 
          rows={3} 
          value={formData.cabeca || ''} 
          onChange={onInputChange} 
          placeholder="Texto da cabeça do VT que será lido pelo apresentador."
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <Label htmlFor="gc">GC (Gerador de Caracteres)</Label>
          <ExportGCButton formData={formData} />
        </div>
        <Textarea 
          id="gc" 
          rows={4} 
          value={formData.gc || ''} 
          onChange={onInputChange} 
          placeholder="Texto do GC que será exibido na tela durante a matéria."
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
        />
      </div>
    </>
  );
};
