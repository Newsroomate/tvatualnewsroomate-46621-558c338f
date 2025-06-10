
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, FileText, Search } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Telejornal } from "@/types";
import { GeneralScheduleModal } from "./general-schedule/GeneralScheduleModal";

interface PostCloseRundownModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTelejornal: Telejornal | null;
  onCreateNew: () => void;
  onViewByDate: (date: Date) => void;
}

export const PostCloseRundownModal = ({
  isOpen,
  onClose,
  currentTelejornal,
  onCreateNew,
  onViewByDate
}: PostCloseRundownModalProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGeneralScheduleModal, setShowGeneralScheduleModal] = useState(false);

  const handleCreateNew = () => {
    onCreateNew(); // SEMPRE carrega o último bloco agora
    onClose();
  };

  const handleViewByDate = () => {
    if (selectedDate && currentTelejornal) {
      setShowGeneralScheduleModal(true);
    }
  };

  const handleViewGeneralSchedule = () => {
    setShowGeneralScheduleModal(true);
  };

  const handleCloseGeneralScheduleModal = () => {
    setShowGeneralScheduleModal(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Abrir Espelho</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              O que você gostaria de fazer com o espelho de <strong>{currentTelejornal?.nome}</strong>?
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={handleCreateNew}
                className="w-full justify-start"
                variant="outline"
              >
                <FileText className="mr-2 h-4 w-4" />
                Criar um novo espelho
              </Button>
              
              <Button 
                onClick={handleViewGeneralSchedule}
                className="w-full justify-start"
                variant="outline"
              >
                <Search className="mr-2 h-4 w-4" />
                Visualizar todos os espelhos anteriores
              </Button>
              
              <div className="space-y-2">
                <Button 
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Buscar espelhos por data específica
                </Button>
                
                {showDatePicker && (
                  <div className="space-y-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          {selectedDate ? (
                            format(selectedDate, "dd/MM/yyyy")
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <Button 
                      onClick={handleViewByDate}
                      disabled={!selectedDate}
                      className="w-full"
                    >
                      Visualizar espelhos desta data
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button variant="ghost" onClick={onClose}>
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <GeneralScheduleModal
        isOpen={showGeneralScheduleModal}
        onClose={handleCloseGeneralScheduleModal}
      />
    </>
  );
};
