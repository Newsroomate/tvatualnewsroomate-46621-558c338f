
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";
import { Telejornal } from "@/types";
import { SavedModelsModal } from "./SavedModelsModal";
import { ModeloEspelho } from "@/types/modelos-espelho";

interface CreateRundownModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTelejornal: Telejornal | null;
  onCreateNew: () => void;
  onCreateFromModel: (modelo: ModeloEspelho) => void;
}

export const CreateRundownModal = ({
  isOpen,
  onClose,
  currentTelejornal,
  onCreateNew,
  onCreateFromModel
}: CreateRundownModalProps) => {
  const [showModelsModal, setShowModelsModal] = useState(false);

  const handleCreateBlank = () => {
    onCreateNew();
    onClose();
  };

  const handleUseModel = () => {
    setShowModelsModal(true);
  };

  const handleSelectModel = async (modelo: ModeloEspelho) => {
    await onCreateFromModel(modelo);
    setShowModelsModal(false);
    onClose();
  };

  const handleCloseModelsModal = () => {
    setShowModelsModal(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Novo Espelho</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Como você gostaria de criar o novo espelho para <strong>{currentTelejornal?.nome}</strong>?
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={handleUseModel}
                className="w-full justify-start"
                variant="outline"
              >
                <FileText className="mr-2 h-4 w-4" />
                Usar um modelo salvo
              </Button>
              
              <Button 
                onClick={handleCreateBlank}
                className="w-full justify-start"
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar espelho em branco
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

      <SavedModelsModal
        isOpen={showModelsModal}
        onClose={handleCloseModelsModal}
        currentTelejornal={currentTelejornal}
        onSelectModel={handleSelectModel}
      />
    </>
  );
};
