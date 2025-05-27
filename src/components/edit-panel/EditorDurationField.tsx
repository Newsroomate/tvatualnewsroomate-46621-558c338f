
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Materia } from "@/types";
import { useDurationCalculator } from "./DurationCalculator";

interface EditorDurationFieldProps {
  formData: Partial<Materia>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const EditorDurationField = ({ formData, onInputChange }: EditorDurationFieldProps) => {
  const { getCabecaWords } = useDurationCalculator();
  const cabecaWords = getCabecaWords(formData.cabeca || '');

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="clip">Clipe</Label>
        <Input 
          id="clip" 
          value={formData.clip || ''} 
          onChange={onInputChange}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="duracao">Duração (segundos)</Label>
        <Input 
          id="duracao" 
          type="number" 
          value={formData.duracao || 0} 
          onChange={onInputChange}
          title="Duração estimada automaticamente baseada na contagem de palavras da cabeça"
        />
        <p className="text-xs text-gray-500">
          Estimativa automática baseada em {Math.round(cabecaWords)} palavras da cabeça
        </p>
      </div>
    </div>
  );
};
