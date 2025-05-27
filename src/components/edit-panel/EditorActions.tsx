
import { Button } from "@/components/ui/button";

interface EditorActionsProps {
  onSave: () => void;
  onClose: () => void;
  isSaving: boolean;
}

export const EditorActions = ({ onSave, onClose, isSaving }: EditorActionsProps) => {
  return (
    <div className="pt-4 flex justify-end space-x-2">
      <Button variant="outline" onClick={onClose}>Cancelar</Button>
      <Button onClick={onSave} disabled={isSaving}>
        {isSaving ? 'Salvando...' : 'Salvar'}
      </Button>
    </div>
  );
};
