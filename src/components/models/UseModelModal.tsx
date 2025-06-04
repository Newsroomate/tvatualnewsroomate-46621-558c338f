
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, PlusCircle } from "lucide-react";

interface UseModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseModel: () => void;
  onCreateNew: () => void;
}

export const UseModelModal = ({
  isOpen,
  onClose,
  onUseModel,
  onCreateNew
}: UseModelModalProps) => {
  const handleUseModel = () => {
    onUseModel();
    onClose();
  };

  const handleCreateNew = () => {
    onCreateNew();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Usar Modelos Salvos?</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Você deseja criar um novo espelho baseado em um modelo salvo ou começar do zero?
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={handleUseModel}
              className="w-full justify-start"
              variant="outline"
            >
              <FileText className="mr-2 h-4 w-4" />
              Sim - Usar modelo salvo
            </Button>
            
            <Button 
              onClick={handleCreateNew}
              className="w-full justify-start"
              variant="outline"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Não - Criar do zero
            </Button>
          </div>
          
          <div className="flex justify-end">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
