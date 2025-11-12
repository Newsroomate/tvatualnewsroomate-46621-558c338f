
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Telejornal } from "@/types";

interface FilterSectionProps {
  telejornais: Telejornal[];
  selectedJornal: string;
  setSelectedJornal: (value: string) => void;
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  selectedTime: string;
  setSelectedTime: (time: string) => void;
  startTime: string;
  setStartTime: (time: string) => void;
  endTime: string;
  setEndTime: (time: string) => void;
  showTimeRange: boolean;
  setShowTimeRange: (show: boolean) => void;
}

export const FilterSection = ({
  telejornais,
  selectedJornal,
  setSelectedJornal,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  showTimeRange,
  setShowTimeRange
}: FilterSectionProps) => {
  
  const formatSelectedDate = () => {
    if (selectedDate) {
      // Usar formatação brasileira para exibição
      return format(selectedDate, "dd/MM/yyyy", { locale: ptBR });
    }
    return "";
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Garantir que a data seja processada corretamente sem conversão de timezone
      const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      console.log("Date selected:", date);
      console.log("Normalized date:", normalizedDate);
      setSelectedDate(normalizedDate);
    } else {
      setSelectedDate(undefined);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Espelho Geral</DialogTitle>
        <DialogDescription>
          Visualize e filtre espelhos fechados de telejornais anteriores
        </DialogDescription>
      </DialogHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Selecione o Jornal</label>
          <Select
            value={selectedJornal}
            onValueChange={(value) => {
              console.log("Jornal selecionado:", value);
              setSelectedJornal(value);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todos os telejornais" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os telejornais</SelectItem>
              {telejornais.map((jornal) => (
                <SelectItem key={jornal.id} value={jornal.id}>
                  {jornal.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Data</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-10",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                {selectedDate ? (
                  formatSelectedDate()
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
                onSelect={(date) => {
                  console.log("Data selecionada:", date);
                  handleDateSelect(date);
                }}
                initialFocus
                className="pointer-events-auto"
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Horário
            <button 
              onClick={() => {
                console.log("Alternando modo de horário:", !showTimeRange);
                setShowTimeRange(!showTimeRange);
                // Limpar valores quando alternar modo
                if (!showTimeRange) {
                  setSelectedTime("");
                } else {
                  setStartTime("");
                  setEndTime("");
                }
              }} 
              className="ml-2 text-xs text-primary hover:underline"
            >
              {showTimeRange ? "Usar horário único" : "Usar faixa de horário"}
            </button>
          </label>
          
          {showTimeRange ? (
            <div className="flex space-x-2">
              <Input
                type="time"
                value={startTime}
                onChange={(e) => {
                  console.log("Horário inicial:", e.target.value);
                  setStartTime(e.target.value);
                }}
                placeholder="Início"
                className="w-full"
              />
              <span className="flex items-center text-muted-foreground">até</span>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => {
                  console.log("Horário final:", e.target.value);
                  setEndTime(e.target.value);
                }}
                placeholder="Fim"
                className="w-full"
              />
            </div>
          ) : (
            <Input
              type="time"
              value={selectedTime}
              onChange={(e) => {
                console.log("Horário único:", e.target.value);
                setSelectedTime(e.target.value);
              }}
              placeholder="00:00"
              className="w-full"
            />
          )}
        </div>
      </div>
      
      {/* Botão para limpar filtros */}
      {(selectedJornal !== "all" || selectedDate || selectedTime || startTime || endTime) && (
        <div className="mb-4 text-center">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              console.log("Limpando todos os filtros");
              setSelectedJornal("all");
              setSelectedDate(undefined);
              setSelectedTime("");
              setStartTime("");
              setEndTime("");
              setShowTimeRange(false);
            }}
          >
            Limpar Filtros
          </Button>
        </div>
      )}
    </>
  );
};
