
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Layout } from "lucide-react";
import { ModelSelectionModal } from "./ModelSelectionModal";
import { ModeloEspelho } from "@/types/models";

interface UseModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFromScratch: () => void;
  onModelSelected: (modelo: ModeloEspelho) => void;
}

export const UseModelModal = ({
  isOpen,
  onClose,
  onCreateFromScratch,
  onModelSelected
}: UseModelModalProps) => {
  const [showModelSelection, setShowModelSelection] = useState(false);

  const handleUseModel = () => {
    setShowModelSelection(true);
  };

  const handleCreateFromScratch = () => {
    console.log("UseModelModal: Creating from scratch - truly empty rundown");
    onClose();
    onCreateFromScratch();
  };

  const handleCloseModelSelection = () => {
    setShowModelSelection(false);
  };

  const handleModelSelected = (modelo: ModeloEspelho) => {
    setShowModelSelection(false);
    onClose();
    onModelSelected(modelo);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Usar Modelos Salvos?</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Você gostaria de criar um novo espelho baseado em um modelo salvo ou começar do zero?
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={handleUseModel}
                className="w-full justify-start"
                variant="outline"
              >
                <Layout className="mr-2 h-4 w-4" />
                Sim - Usar modelo salvo
              </Button>
              
              <Button 
                onClick={handleCreateFromScratch}
                className="w-full justify-start"
                variant="outline"
              >
                <FileText className="mr-2 h-4 w-4" />
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

      <ModelSelectionModal
        isOpen={showModelSelection}
        onClose={handleCloseModelSelection}
        onModelSelected={handleModelSelected}
      />
    </>
  );
};
