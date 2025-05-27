
import { Button } from "@/components/ui/button";
import { Materia } from "@/types";

interface EditPanelHeaderProps {
  item: Materia;
  onClose: () => void;
}

export const EditPanelHeader = ({ item, onClose }: EditPanelHeaderProps) => {
  return (
    <div className="bg-primary text-primary-foreground p-4 flex justify-between items-center sticky top-0 z-10">
      <h3 className="font-medium">Editar: {item.retranca}</h3>
      <Button variant="ghost" size="sm" onClick={onClose}>
        Fechar
      </Button>
    </div>
  );
};
