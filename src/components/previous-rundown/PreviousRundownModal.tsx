
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Telejornal } from "@/types";
import { format } from "date-fns";
import { SavedRundown } from "@/types/saved-rundowns";
import { fetchSavedRundownsByDate } from "@/services/saved-rundowns-api";
import { NewsScheduleCore } from "@/components/news-schedule/NewsScheduleCore";

interface PreviousRundownModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJournal: string;
  selectedDate: Date;
  telejornais: Telejornal[];
}

export const PreviousRundownModal = ({
  isOpen,
  onClose,
  selectedJournal,
  selectedDate,
  telejornais
}: PreviousRundownModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [savedRundowns, setSavedRundowns] = useState<SavedRundown[]>([]);
  const [selectedRundown, setSelectedRundown] = useState<SavedRundown | null>(null);
  
  const currentTelejornal = telejornais.find(t => t.id === selectedJournal);

  useEffect(() => {
    if (isOpen && selectedJournal && selectedDate) {
      loadSavedRundowns();
    }
  }, [isOpen, selectedJournal, selectedDate]);

  const loadSavedRundowns = async () => {
    setIsLoading(true);
    try {
      const dateString = format(selectedDate, "yyyy-MM-dd");
      const rundowns = await fetchSavedRundownsByDate(selectedJournal, dateString);
      setSavedRundowns(rundowns);
      
      // Selecionar automaticamente o primeiro espelho se houver apenas um
      if (rundowns.length === 1) {
        setSelectedRundown(rundowns[0]);
      } else if (rundowns.length > 1) {
        // Se houver múltiplos, selecionar o mais recente
        const mostRecent = rundowns.sort((a, b) => 
          new Date(b.data_salvamento).getTime() - new Date(a.data_salvamento).getTime()
        )[0];
        setSelectedRundown(mostRecent);
      }
    } catch (error) {
      console.error("Erro ao carregar espelhos salvos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedRundown(null);
    setSavedRundowns([]);
    onClose();
  };

  const handleBackToList = () => {
    setSelectedRundown(null);
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-7xl h-auto max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando espelhos salvos...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-7xl h-auto max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectedRundown ? handleBackToList : handleClose}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {selectedRundown ? "Voltar à Lista" : "Voltar"}
              </Button>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  {currentTelejornal?.nome} - {format(selectedDate, "dd/MM/yyyy")}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedRundown 
                    ? `Editando: ${selectedRundown.nome}` 
                    : "Selecione um espelho para editar"
                  }
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          {selectedRundown ? (
            <div className="h-full">
              <NewsScheduleCore
                telejornalId={selectedJournal}
                savedRundownId={selectedRundown.id}
                isSnapshot={true}
                onClose={handleClose}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {savedRundowns.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Nenhum espelho salvo encontrado para esta data.
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="font-semibold text-lg">
                    Espelhos Disponíveis ({savedRundowns.length})
                  </h3>
                  <div className="grid gap-4 max-h-96 overflow-y-auto">
                    {savedRundowns.map((rundown) => (
                      <div
                        key={rundown.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedRundown(rundown)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{rundown.nome}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Salvo em: {format(new Date(rundown.data_salvamento), "dd/MM/yyyy 'às' HH:mm")}
                            </p>
                            {rundown.estrutura?.blocos && (
                              <p className="text-xs text-gray-500 mt-1">
                                {rundown.estrutura.blocos.length} bloco(s) - {' '}
                                {rundown.estrutura.blocos.reduce((total, bloco) => 
                                  total + (bloco.items?.length || 0), 0
                                )} matéria(s)
                              </p>
                            )}
                          </div>
                          <Button variant="outline" size="sm">
                            Abrir
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
