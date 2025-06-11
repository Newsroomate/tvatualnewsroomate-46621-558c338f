
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Telejornal } from "@/types";
import { format } from "date-fns";
import { SavedRundownsModal } from "@/components/SavedRundownsModal";

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
  
  const currentTelejornal = telejornais.find(t => t.id === selectedJournal);

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-7xl h-auto max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  {currentTelejornal?.nome} - {format(selectedDate, "dd/MM/yyyy")}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Espelho anterior com funcionalidade completa de edição
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <SavedRundownsModal
            isOpen={isOpen}
            onClose={onClose}
            telejornalId={selectedJournal}
            targetDate={selectedDate}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
