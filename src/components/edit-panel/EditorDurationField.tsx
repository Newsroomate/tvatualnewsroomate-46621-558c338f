
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Materia } from "@/types";

interface EditorDurationFieldProps {
  formData: Partial<Materia>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  disabled?: boolean;
}

export const EditorDurationField = ({ 
  formData, 
  onInputChange,
  disabled = false 
}: EditorDurationFieldProps) => {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="duracao">Duração (segundos)</Label>
      <Input
        id="duracao"
        type="number"
        value={formData.duracao || 0}
        onChange={onInputChange}
        min="0"
        disabled={disabled}
      />
    </div>
  );
};
