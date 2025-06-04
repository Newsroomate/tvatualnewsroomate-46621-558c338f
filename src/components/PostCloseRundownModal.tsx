
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
import { UseModelModal } from "./models/UseModelModal";
import { ModelSelectionModal } from "./models/ModelSelectionModal";
import { EspelhoModelo } from "@/types/models";

interface PostCloseRundownModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTelejornal: Telejornal | null;
  onCreateNew: () => void;
  onCreateFromModel: (modelo: EspelhoModelo) => void;
  onViewByDate: (date: Date) => void;
}

export const PostCloseRundownModal = ({
  isOpen,
  onClose,
  currentTelejornal,
  onCreateNew,
  onCreateFromModel,
  onViewByDate
}: PostCloseRundownModalProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGeneralScheduleModal, setShowGeneralScheduleModal] = useState(false);
  const [showUseModelModal, setShowUseModelModal] = useState(false);
  const [showModelSelectionModal, setShowModelSelectionModal] = useState(false);

  const handleCreateNew = () => {
    setShowUseModelModal(true);
  };

  const handleUseModel = () => {
    setShowModelSelectionModal(true);
  };

  const handleCreateFromScratch = () => {
    onCreateNew();
    onClose();
  };

  const handleSelectModel = (modelo: EspelhoModelo) => {
    onCreateFromModel(modelo);
    onClose();
  };

  const handleViewByDate = () => {
    if (selectedDate && currentTelejornal) {
      setShowGeneralScheduleModal(true);
    }
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
              
              <div className="space-y-2">
                <Button 
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Visualizar espelho de data selecionada
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

      <UseModelModal
        isOpen={showUseModelModal}
        onClose={() => setShowUseModelModal(false)}
        onUseModel={handleUseModel}
        onCreateNew={handleCreateFromScratch}
      />

      <ModelSelectionModal
        isOpen={showModelSelectionModal}
        onClose={() => setShowModelSelectionModal(false)}
        onSelectModel={handleSelectModel}
      />

      <GeneralScheduleModal
        isOpen={showGeneralScheduleModal}
        onClose={handleCloseGeneralScheduleModal}
      />
    </>
  );
};
