
import { useState } from "react";
import { Calendar, Clock, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { SavedRundownsModal } from "../saved-rundowns/SavedRundownsModal";
import { SavedRundownReadOnlyView } from "../saved-rundowns/SavedRundownReadOnlyView";
import { useSavedRundowns } from "@/hooks/useSavedRundowns";
import { useToast } from "@/hooks/use-toast";

interface OpenRundownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateNew: () => void;
  onReopenLast: () => void;
  onReopenFromDate: (date: Date) => void;
  currentTelejornalId?: string;
}

export const OpenRundownDialog = ({
  open,
  onOpenChange,
  onCreateNew,
  onReopenLast,
  onReopenFromDate,
  currentTelejornalId
}: OpenRundownDialogProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [savedRundownsModalOpen, setSavedRundownsModalOpen] = useState(false);
  const [lastRundownViewOpen, setLastRundownViewOpen] = useState(false);
  
  const { toast } = useToast();
  const { loadLastRundown, lastRundown, isLoading } = useSavedRundowns();

  const handleReopenFromDate = () => {
    if (selectedDate) {
      setSavedRundownsModalOpen(true);
    }
  };

  const handleCreateNew = () => {
    onCreateNew();
    onOpenChange(false);
  };

  const handleReopenLast = async () => {
    if (!currentTelejornalId) {
      toast({
        title: "Erro",
        description: "Nenhum telejornal selecionado",
        variant: "destructive"
      });
      return;
    }

    try {
      const rundown = await loadLastRundown(currentTelejornalId);
      if (rundown) {
        setLastRundownViewOpen(true);
      } else {
        toast({
          title: "Nenhum espelho encontrado",
          description: "Não há espelhos salvos para este telejornal",
        });
      }
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Abrir Espelho</DialogTitle>
            <DialogDescription>
              Escolha uma das opções para abrir o espelho do telejornal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Create New Rundown */}
            <Button onClick={handleCreateNew} className="w-full justify-start h-auto p-4" variant="outline">
              <Plus className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Criar Novo Espelho</div>
                <div className="text-sm text-muted-foreground">
                  Cria um espelho completamente novo
                </div>
              </div>
            </Button>

            {/* Reopen Last Rundown */}
            <Button 
              onClick={handleReopenLast} 
              className="w-full justify-start h-auto p-4" 
              variant="outline"
              disabled={isLoading}
            >
              <Clock className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Visualizar Último Espelho</div>
                <div className="text-sm text-muted-foreground">
                  Abre o último espelho salvo em modo leitura
                </div>
              </div>
            </Button>

            {/* Reopen from Specific Date */}
            <div className="space-y-2">
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start h-auto p-4">
                    <Calendar className="h-5 w-5 mr-3" />
                    <div className="text-left flex-1">
                      <div className="font-medium">Visualizar de Data Específica</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Selecione uma data"}
                      </div>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent mode="single" selected={selectedDate} onSelect={date => {
                    setSelectedDate(date);
                    setDatePickerOpen(false);
                  }} initialFocus />
                </PopoverContent>
              </Popover>
              
              {selectedDate && (
                <Button onClick={handleReopenFromDate} className="w-full" variant="default">
                  Ver Espelhos de {format(selectedDate, "dd/MM/yyyy")}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Saved Rundowns Modal */}
      <SavedRundownsModal
        isOpen={savedRundownsModalOpen}
        onClose={() => setSavedRundownsModalOpen(false)}
      />

      {/* Last Rundown Read-Only View */}
      {lastRundownViewOpen && lastRundown && (
        <Dialog open={lastRundownViewOpen} onOpenChange={setLastRundownViewOpen}>
          <DialogContent className="sm:max-w-4xl h-auto max-h-[80vh] overflow-hidden flex flex-col">
            <SavedRundownReadOnlyView 
              selectedRundown={lastRundown} 
              onClose={() => setLastRundownViewOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
