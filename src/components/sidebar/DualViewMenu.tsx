
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Telejornal } from "@/types";
import { Monitor, MonitorX } from "lucide-react";

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
  const [secondJournalId, setSecondJournalId] = useState<string>("");

  const availableJournals = telejornais.filter(journal => journal.id !== selectedJournal);

  const handleActivate = () => {
    if (secondJournalId) {
      onActivateDualView(secondJournalId);
      setSecondJournalId("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Visualização Dual</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Ative a visualização dual para trabalhar com dois telejornais simultaneamente.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Segundo Telejornal:</label>
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
                onClick={handleActivate} 
                disabled={!secondJournalId}
                className="flex-1"
              >
                <Monitor className="h-4 w-4 mr-2" />
                Ativar Dual View
              </Button>
              
              <Button 
                variant="outline" 
                onClick={onDeactivateDualView}
                className="flex-1"
              >
                <MonitorX className="h-4 w-4 mr-2" />
                Desativar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
