
import { useState } from "react";
import { Calendar, Clock, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface OpenRundownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateNew: () => void;
  onReopenLast: () => void;
  onReopenFromDate: (date: Date) => void;
}

export const OpenRundownDialog = ({
  open,
  onOpenChange,
  onCreateNew,
  onReopenLast,
  onReopenFromDate
}: OpenRundownDialogProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const handleReopenFromDate = () => {
    if (selectedDate) {
      onReopenFromDate(selectedDate);
      onOpenChange(false);
    }
  };

  const handleCreateNew = () => {
    onCreateNew();
    onOpenChange(false);
  };

  const handleReopenLast = () => {
    onReopenLast();
    onOpenChange(false);
  };

  return (
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
          <Button
            onClick={handleCreateNew}
            className="w-full justify-start h-auto p-4"
            variant="outline"
          >
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
          >
            <Clock className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-medium">Reabrir Último Espelho</div>
              <div className="text-sm text-muted-foreground">
                Reabre o último espelho utilizado
              </div>
            </div>
          </Button>

          {/* Reopen from Specific Date */}
          <div className="space-y-2">
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-4"
                >
                  <Calendar className="h-5 w-5 mr-3" />
                  <div className="text-left flex-1">
                    <div className="font-medium">Reabrir de Data Específica</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Selecione uma data"}
                    </div>
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setDatePickerOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            {selectedDate && (
              <Button
                onClick={handleReopenFromDate}
                className="w-full"
                variant="default"
              >
                Reabrir Espelho de {format(selectedDate, "dd/MM/yyyy")}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
