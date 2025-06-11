
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Telejornal } from "@/types";
import { Monitor, MonitorX, FileText, Eye, Settings, Calendar } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";

interface MainMenuProps {
  isOpen: boolean;
  onClose: () => void;
  telejornais: Telejornal[];
  selectedJournal: string | null;
  onActivateDualView: (secondJournalId: string) => void;
  onDeactivateDualView: () => void;
  onOpenGeneralSchedule: () => void;
  onOpenPreviousRundown: (journalId: string, date: Date) => void;
}

export const MainMenu = ({
  isOpen,
  onClose,
  telejornais,
  selectedJournal,
  onActivateDualView,
  onDeactivateDualView,
  onOpenGeneralSchedule,
  onOpenPreviousRundown
}: MainMenuProps) => {
  const [secondJournalId, setSecondJournalId] = useState<string>("");
  const [selectedJournalForRundown, setSelectedJournalForRundown] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

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

  const handleOpenPreviousRundown = () => {
    if (selectedJournalForRundown && selectedDate) {
      onOpenPreviousRundown(selectedJournalForRundown, selectedDate);
      setSelectedJournalForRundown("");
      setSelectedDate(undefined);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white border border-gray-200 shadow-lg">
        <DialogHeader className="pb-6 border-b border-gray-100">
          <DialogTitle className="flex items-center gap-3 text-xl font-medium text-gray-800">
            <Settings className="h-5 w-5 text-gray-600" />
            Menu Principal
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-2">
          {/* Espelhos Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-50 rounded-lg">
                <Calendar className="h-4 w-4 text-gray-600" />
              </div>
              <h3 className="text-base font-medium text-gray-800">Espelhos</h3>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-5 space-y-4 border border-gray-100">
              <p className="text-sm text-gray-600 leading-relaxed">
                Visualize e edite espelhos de datas anteriores com total funcionalidade preservada.
              </p>
              
              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">
                    Selecionar telejornal:
                  </label>
                  <Select value={selectedJournalForRundown} onValueChange={setSelectedJournalForRundown}>
                    <SelectTrigger className="w-full bg-white border-gray-200 text-gray-700 hover:border-gray-300 focus:border-gray-400 transition-colors duration-200">
                      <SelectValue placeholder="Escolha um telejornal" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 shadow-lg">
                      {telejornais.map((journal) => (
                        <SelectItem 
                          key={journal.id} 
                          value={journal.id}
                          className="text-gray-700 hover:bg-gray-50 focus:bg-gray-50"
                        >
                          {journal.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">
                    Selecionar data:
                  </label>
                  <DatePicker 
                    date={selectedDate} 
                    onDateChange={setSelectedDate}
                    placeholder="Escolha uma data"
                  />
                </div>
                
                <Button 
                  onClick={handleOpenPreviousRundown} 
                  disabled={!selectedJournalForRundown || !selectedDate}
                  className="w-full bg-gray-700 hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 text-white font-medium py-2.5 transition-colors duration-200"
                  size="default"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Abrir Espelho
                </Button>
              </div>
            </div>
          </div>

          {/* Visual Separator */}
          <Separator className="my-6 bg-gray-200" />

          {/* Espelho Geral Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-50 rounded-lg">
                <FileText className="h-4 w-4 text-gray-600" />
              </div>
              <h3 className="text-base font-medium text-gray-800">Espelho Geral</h3>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-5 space-y-4 border border-gray-100">
              <p className="text-sm text-gray-600 leading-relaxed">
                Visualize todos os espelhos fechados do sistema em uma única tela para acompanhamento geral.
              </p>
              
              <Button 
                onClick={handleOpenGeneralSchedule}
                className="w-full bg-gray-700 hover:bg-gray-800 text-white font-medium py-2.5 transition-colors duration-200"
                size="default"
              >
                <Eye className="h-4 w-4 mr-2" />
                Abrir Espelho Geral
              </Button>
            </div>
          </div>

          {/* Visual Separator */}
          <Separator className="my-6 bg-gray-200" />

          {/* Visualização Dual Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-50 rounded-lg">
                <Monitor className="h-4 w-4 text-gray-600" />
              </div>
              <h3 className="text-base font-medium text-gray-800">Visualização Dual</h3>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-5 space-y-5 border border-gray-100">
              <p className="text-sm text-gray-600 leading-relaxed">
                Ative a visualização dual para trabalhar com dois telejornais simultaneamente em painéis separados.
              </p>
              
              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">
                    Selecionar segundo telejornal:
                  </label>
                  <Select value={secondJournalId} onValueChange={setSecondJournalId}>
                    <SelectTrigger className="w-full bg-white border-gray-200 text-gray-700 hover:border-gray-300 focus:border-gray-400 transition-colors duration-200">
                      <SelectValue placeholder="Escolha um telejornal para visualização dual" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 shadow-lg">
                      {availableJournals.map((journal) => (
                        <SelectItem 
                          key={journal.id} 
                          value={journal.id}
                          className="text-gray-700 hover:bg-gray-50 focus:bg-gray-50"
                        >
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
                    className="bg-gray-700 hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 text-white font-medium py-2.5 transition-colors duration-200"
                    size="default"
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    Ativar
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleDeactivateDualView}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium py-2.5 transition-colors duration-200"
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
