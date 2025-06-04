
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Sparkles } from "lucide-react";
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
    console.log("Criando espelho em branco");
    onCreateNew();
    onClose();
  };

  const handleUseModel = () => {
    setShowModelsModal(true);
  };

  const handleSelectModel = (modelo: ModeloEspelho) => {
    console.log("Modelo selecionado:", modelo.nome);
    onCreateFromModel(modelo);
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
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Criar Novo Espelho
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Como você gostaria de criar o novo espelho para{" "}
                <span className="font-semibold text-gray-900">{currentTelejornal?.nome}</span>?
              </p>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={handleUseModel}
                className="w-full justify-start h-auto p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 text-blue-800"
                variant="outline"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div className="text-left">
                    <div className="font-medium">Usar um modelo salvo</div>
                    <div className="text-xs text-blue-600 opacity-80">
                      Reutilize uma estrutura de espelho previamente salva
                    </div>
                  </div>
                </div>
              </Button>
              
              <Button 
                onClick={handleCreateBlank}
                className="w-full justify-start h-auto p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border border-gray-200 text-gray-800"
                variant="outline"
              >
                <div className="flex items-center gap-3">
                  <Plus className="h-5 w-5 text-gray-600" />
                  <div className="text-left">
                    <div className="font-medium">Criar espelho em branco</div>
                    <div className="text-xs text-gray-600 opacity-80">
                      Comece do zero com um espelho vazio
                    </div>
                  </div>
                </div>
              </Button>
            </div>
            
            <div className="flex justify-end pt-4 border-t">
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
