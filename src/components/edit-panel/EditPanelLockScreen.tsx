
import { Button } from "@/components/ui/button";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { AlertCircle, Lock } from "lucide-react";
import { Materia } from "@/types";

interface EditPanelLockScreenProps {
  item: Materia;
  onClose: () => void;
}

export const EditPanelLockScreen = ({ item, onClose }: EditPanelLockScreenProps) => {
  return (
    <div className="fixed top-0 left-0 w-full h-full z-20 pointer-events-none">
      <ResizablePanelGroup direction="horizontal" className="w-full h-full pointer-events-auto">
        <ResizablePanel defaultSize={60} minSize={30} className="pointer-events-none" />
        <ResizableHandle withHandle className="w-2 bg-gray-300 hover:bg-gray-400 transition-colors pointer-events-auto" />
        <ResizablePanel defaultSize={40} minSize={25} maxSize={70} className="pointer-events-auto">
          <div className="w-full h-full bg-white border-l border-gray-200 shadow-lg overflow-y-auto">
            <div className="bg-primary text-primary-foreground p-4 flex justify-between items-center">
              <h3 className="font-medium">Matéria Bloqueada</h3>
              <Button variant="ghost" size="sm" onClick={onClose}>
                Fechar
              </Button>
            </div>
            
            <div className="p-8 text-center">
              <Lock className="w-16 h-16 mx-auto mb-4 text-orange-500" />
              <h4 className="text-lg font-semibold mb-2">Matéria em Edição</h4>
              <p className="text-gray-600 mb-4">
                Esta matéria está sendo editada por outro usuário no momento.
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-orange-500 mr-2" />
                  <p className="text-orange-800 text-sm">
                    <strong>Retranca:</strong> {item.retranca}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Aguarde até que o outro usuário termine a edição ou tente novamente em alguns minutos.
              </p>
              <Button onClick={onClose} variant="outline">
                Voltar
              </Button>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
