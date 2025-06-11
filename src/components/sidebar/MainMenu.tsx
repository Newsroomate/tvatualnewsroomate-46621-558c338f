
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MonitorSpeaker, Archive, Eye, ArrowLeft, BarChart } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Telejornal } from "@/types";
import { ClosedRundownSnapshot, fetchClosedRundownSnapshots } from "@/services/snapshots-api";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface MainMenuProps {
  isOpen: boolean;
  onClose: () => void;
  telejornais: Telejornal[];
  selectedJournal: string | null;
  onActivateDualView: (secondJournalId: string) => void;
  onDeactivateDualView: () => void;
  onOpenGeneralSchedule: () => void;
  onOpenHistorico: (snapshot: ClosedRundownSnapshot) => void;
}

type MenuSection = 'main' | 'general-schedule' | 'dual-view' | 'historico';

export const MainMenu = ({
  isOpen,
  onClose,
  telejornais,
  selectedJournal,
  onActivateDualView,
  onDeactivateDualView,
  onOpenGeneralSchedule,
  onOpenHistorico
}: MainMenuProps) => {
  const [currentSection, setCurrentSection] = useState<MenuSection>('main');
  const [selectedSecondJournal, setSelectedSecondJournal] = useState<string>("");
  
  // Histórico states
  const [selectedTelejornal, setSelectedTelejornal] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [espelhos, setEspelhos] = useState<ClosedRundownSnapshot[]>([]);
  const [isLoadingEspelhos, setIsLoadingEspelhos] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const handleClose = () => {
    setCurrentSection('main');
    onClose();
  };

  const handleBackToMain = () => {
    setCurrentSection('main');
  };

  const handleActivateDualView = () => {
    if (selectedSecondJournal && selectedJournal) {
      onActivateDualView(selectedSecondJournal);
      handleClose();
    }
  };

  const handleDeactivateDualView = () => {
    onDeactivateDualView();
    handleClose();
  };

  const handleOpenGeneralSchedule = () => {
    onOpenGeneralSchedule();
    handleClose();
  };

  const loadEspelhos = async () => {
    if (!selectedDate) return;
    
    setIsLoadingEspelhos(true);
    try {
      const data = await fetchClosedRundownSnapshots(
        selectedTelejornal === "all" ? undefined : selectedTelejornal,
        selectedDate
      );
      setEspelhos(data);
    } catch (error) {
      console.error("Erro ao carregar espelhos históricos:", error);
      setEspelhos([]);
    } finally {
      setIsLoadingEspelhos(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setIsDatePickerOpen(false);
  };

  const handleOpenHistoricoSection = () => {
    setCurrentSection('historico');
    loadEspelhos();
  };

  const handleOpenHistoricoEspelho = (espelho: ClosedRundownSnapshot) => {
    onOpenHistorico(espelho);
    handleClose();
  };

  // Atualizar espelhos quando filtros mudarem
  React.useEffect(() => {
    if (currentSection === 'historico') {
      loadEspelhos();
    }
  }, [selectedTelejornal, selectedDate, currentSection]);

  const availableJournals = telejornais.filter(journal => journal.id !== selectedJournal);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md h-auto max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center">
            {currentSection !== 'main' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToMain}
                className="mr-2 p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {currentSection === 'main' && 'Menu Principal'}
            {currentSection === 'general-schedule' && 'Espelho Geral'}
            {currentSection === 'dual-view' && 'Visualização Dual'}
            {currentSection === 'historico' && 'Histórico de Espelhos'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Main Menu */}
          {currentSection === 'main' && (
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleOpenGeneralSchedule}
              >
                <BarChart className="h-4 w-4 mr-3" />
                Espelho Geral
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setCurrentSection('dual-view')}
              >
                <MonitorSpeaker className="h-4 w-4 mr-3" />
                Visualização Dual
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleOpenHistoricoSection}
              >
                <Archive className="h-4 w-4 mr-3" />
                Histórico de Espelhos
              </Button>
            </div>
          )}

          {/* Dual View Section */}
          {currentSection === 'dual-view' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Telejornal secundário:
                </label>
                <Select value={selectedSecondJournal} onValueChange={setSelectedSecondJournal}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar telejornal" />
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

              <div className="flex space-x-2">
                <Button 
                  onClick={handleActivateDualView} 
                  disabled={!selectedSecondJournal}
                  className="flex-1"
                >
                  Ativar Visualização Dual
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleDeactivateDualView}
                  className="flex-1"
                >
                  Desativar
                </Button>
              </div>
            </div>
          )}

          {/* Histórico Section */}
          {currentSection === 'historico' && (
            <div className="space-y-4">
              {/* Filtros */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Telejornal:</label>
                  <Select value={selectedTelejornal} onValueChange={setSelectedTelejornal}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecionar telejornal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os telejornais</SelectItem>
                      {telejornais.map((journal) => (
                        <SelectItem key={journal.id} value={journal.id}>
                          {journal.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Data:</label>
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {selectedDate ? (
                          format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          "Selecionar data"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Lista de espelhos */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {isLoadingEspelhos ? (
                  <div className="text-sm text-gray-500 text-center py-4">
                    Carregando espelhos...
                  </div>
                ) : espelhos.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-4">
                    Nenhum espelho encontrado para esta data
                  </div>
                ) : (
                  espelhos.map((espelho) => (
                    <div
                      key={espelho.id}
                      className="p-3 bg-gray-50 rounded-md border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => handleOpenHistoricoEspelho(espelho)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-800 truncate">
                            {espelho.nome_telejornal}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {format(new Date(espelho.data_referencia), "dd/MM", { locale: ptBR })}
                            </span>
                            {espelho.horario && (
                              <span className="text-xs text-gray-500">
                                {espelho.horario}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {espelho.estrutura_completa.metadata.total_blocos} bloco(s)
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenHistoricoEspelho(espelho);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
