
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Telejornal } from "@/types";
import { Monitor, MonitorX, FileText } from "lucide-react";

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Menu Principal</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Espelho Geral Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Espelho Geral</h3>
            <p className="text-xs text-gray-600">
              Visualize todos os espelhos fechados do sistema.
            </p>
            <Button 
              onClick={handleOpenGeneralSchedule}
              className="w-full"
              variant="outline"
            >
              <FileText className="h-4 w-4 mr-2" />
              Abrir Espelho Geral
            </Button>
          </div>

          {/* Separator */}
          <div className="border-t border-gray-200" />

          {/* Visualização Dual Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Visualização Dual</h3>
            <p className="text-xs text-gray-600">
              Ative a visualização dual para trabalhar com dois telejornais simultaneamente.
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">Segundo Telejornal:</label>
                <Select value={secondJournalId} onValueChange={setSecondJournalId}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Selecione um telejornal" />
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
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleActivateDualView} 
                  disabled={!secondJournalId}
                  className="flex-1"
                  size="sm"
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  Ativar Dual View
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleDeactivateDualView}
                  className="flex-1"
                  size="sm"
                >
                  <MonitorX className="h-4 w-4 mr-2" />
                  Desativar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
