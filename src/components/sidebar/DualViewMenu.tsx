
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Eye, EyeOff } from "lucide-react";
import { Telejornal } from "@/types";
import { GeneralScheduleModal } from "@/components/general-schedule";

interface DualViewMenuProps {
  isOpen: boolean;
  onClose: () => void;
  telejornais: Telejornal[];
  selectedJournal: string | null;
  onActivateDualView: (secondJournalId: string) => void;
  onDeactivateDualView: () => void;
}

export const DualViewMenu = ({
  isOpen,
  onClose,
  telejornais,
  selectedJournal,
  onActivateDualView,
  onDeactivateDualView
}: DualViewMenuProps) => {
  const [isGeneralScheduleOpen, setIsGeneralScheduleOpen] = useState(false);

  const availableJournals = telejornais.filter(journal => journal.id !== selectedJournal);

  const handleOpenGeneralSchedule = () => {
    setIsGeneralScheduleOpen(true);
    onClose(); // Fechar o menu principal
  };

  const handleActivateDualView = (journalId: string) => {
    onActivateDualView(journalId);
    onClose();
  };

  const handleDeactivateDualView = () => {
    onDeactivateDualView();
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Menu de Opções</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Opção Espelho Geral */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Espelho Geral</h4>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={handleOpenGeneralSchedule}
              >
                <FileText className="h-4 w-4 mr-2" />
                Visualizar Espelho Geral
              </Button>
            </div>

            {/* Divisor */}
            <div className="border-t border-gray-200" />

            {/* Opções de Visualização Dual */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Visualização Dual</h4>
              
              {availableJournals.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 mb-2">
                    Selecione um segundo telejornal para comparar:
                  </p>
                  {availableJournals.map((journal) => (
                    <Button
                      key={journal.id}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left"
                      onClick={() => handleActivateDualView(journal.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {journal.nome}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Nenhum outro telejornal disponível para comparação.
                </p>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={handleDeactivateDualView}
              >
                <EyeOff className="h-4 w-4 mr-2" />
                Desativar Visualização Dual
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal do Espelho Geral */}
      <GeneralScheduleModal 
        isOpen={isGeneralScheduleOpen} 
        onClose={() => setIsGeneralScheduleOpen(false)} 
      />
    </>
  );
};
