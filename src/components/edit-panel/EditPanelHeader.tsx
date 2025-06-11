
import { Button } from "@/components/ui/button";
import { Materia } from "@/types";
import { Save } from "lucide-react";

interface EditPanelHeaderProps {
  item: Materia;
  onClose: () => void;
  onSave?: () => void;
  isSaving?: boolean;
}

export const EditPanelHeader = ({ item, onClose, onSave, isSaving = false }: EditPanelHeaderProps) => {
  return (
    <div className="bg-primary text-primary-foreground p-4 flex justify-between items-center sticky top-0 z-10">
      <h3 className="font-medium">Editar: {item.retranca}</h3>
      <div className="flex space-x-2">
        {onSave && (
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={onSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </div>
  );
};
