
import { useState, useEffect, useCallback } from "react";
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

  // Reset internal state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      console.log("UseModelModal: Resetting internal state on close");
      setShowModelSelection(false);
    } else {
      console.log("UseModelModal: Modal opened, state ready");
    }
  }, [isOpen]);

  const handleUseModel = useCallback(() => {
    console.log("UseModelModal: Use model button clicked");
    setShowModelSelection(true);
  }, []);

  const handleCreateFromScratch = useCallback(() => {
    console.log("UseModelModal: Creating from scratch - truly empty rundown");
    onClose();
    onCreateFromScratch();
  }, [onClose, onCreateFromScratch]);

  const handleCloseModelSelection = useCallback(() => {
    console.log("UseModelModal: Closing model selection");
    setShowModelSelection(false);
  }, []);

  const handleModelSelected = useCallback((modelo: ModeloEspelho) => {
    console.log("UseModelModal: Model selected:", modelo.nome);
    setShowModelSelection(false);
    onClose();
    onModelSelected(modelo);
  }, [onClose, onModelSelected]);

  const handleDialogClose = useCallback(() => {
    console.log("UseModelModal: Dialog close requested");
    onClose();
  }, [onClose]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleDialogClose}>
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
              <Button variant="ghost" onClick={handleDialogClose}>
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
