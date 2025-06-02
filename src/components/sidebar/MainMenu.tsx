
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Telejornal } from "@/types";
import { Monitor, MonitorX, FileText, Eye, Settings } from "lucide-react";

interface MainMenuProps {
  isOpen: boolean;
  onClose: () => void;
  telejornais: Telejornal[];
  selectedJournal: string | null;
  onActivateDualView: (secondJournalId: string) => void;
  onDeactivateDualView: () => void;
  onOpenGeneralSchedule: () => void;
}

export const MainMenu = ({
  isOpen,
  onClose,
  telejornais,
  selectedJournal,
  onActivateDualView,
  onDeactivateDualView,
  onOpenGeneralSchedule
}: MainMenuProps) => {
  const [secondJournalId, setSecondJournalId] = useState<string>("");

  const availableJournals = telejornais.filter(journal => journal.id !== selectedJournal);

  const handleActivateDualView = () => {
    if (secondJournalId) {
      onActivateDualView(secondJournalId);
      setSecondJournalId("");
      onClose();
    }
  };

  const handleDeactivateDualView = () => {
    onDeactivateDualView();
    onClose();
  };

  const handleOpenGeneralSchedule = () => {
    onOpenGeneralSchedule();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Settings className="h-5 w-5" />
            Menu Principal
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8">
          {/* Espelho Geral Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-blue-600" />
              <h3 className="text-base font-semibold text-gray-900">Espelho Geral</h3>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                Visualize todos os espelhos fechados do sistema em uma única tela para acompanhamento geral.
              </p>
              
              <Button 
                onClick={handleOpenGeneralSchedule}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
                size="default"
              >
                <Eye className="h-4 w-4 mr-2" />
                Abrir Espelho Geral
              </Button>
            </div>
          </div>

          {/* Visual Separator */}
          <Separator className="my-6" />

          {/* Visualização Dual Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Monitor className="h-4 w-4 text-green-600" />
              <h3 className="text-base font-semibold text-gray-900">Visualização Dual</h3>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 space-y-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                Ative a visualização dual para trabalhar com dois telejornais simultaneamente em painéis separados.
              </p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-800">
                    Selecionar segundo telejornal:
                  </label>
                  <Select value={secondJournalId} onValueChange={setSecondJournalId}>
                    <SelectTrigger className="w-full bg-white border-gray-300">
                      <SelectValue placeholder="Escolha um telejornal para visualização dual" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableJournals.map((journal) => (
                        <SelectItem key={journal.id} value={journal.id}>
                          {journal.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={handleActivateDualView} 
                    disabled={!secondJournalId}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium py-2.5"
                    size="default"
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    Ativar
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleDeactivateDualView}
                    className="border-green-600 text-green-600 hover:bg-green-50 font-medium py-2.5"
                    size="default"
                  >
                    <MonitorX className="h-4 w-4 mr-2" />
                    Desativar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
