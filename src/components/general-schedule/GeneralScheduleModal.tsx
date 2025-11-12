
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { fetchTelejornais } from "@/services/api";
import { fetchClosedRundownSnapshots, ClosedRundownSnapshot } from "@/services/snapshots-api";
import { Telejornal } from "@/types";
import { useToast } from "@/hooks/use-toast";

import { FilterSection } from "./FilterSection";
import { ClosedRundownContent } from "./ClosedRundownContent";

interface GeneralScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GeneralScheduleModal = ({ isOpen, onClose }: GeneralScheduleModalProps) => {
  const [telejornais, setTelejornais] = useState<Telejornal[]>([]);
  const [selectedJornal, setSelectedJornal] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [showTimeRange, setShowTimeRange] = useState<boolean>(false);
  const [closedSnapshots, setClosedSnapshots] = useState<ClosedRundownSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadTelejornais();
      // Resetar filtros quando abrir o modal
      setSelectedJornal("all");
      setSelectedDate(undefined);
      setSelectedTime("");
      setStartTime("");
      setEndTime("");
      setShowTimeRange(false);
      // Carregar espelhos sem filtro inicialmente
      loadClosedSnapshots();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      // Debounce para evitar múltiplas chamadas
      const timeoutId = setTimeout(() => {
        loadClosedSnapshots();
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedJornal, selectedDate, selectedTime, startTime, endTime, showTimeRange, isOpen]);

  const loadTelejornais = async () => {
    try {
      const data = await fetchTelejornais();
      setTelejornais(data);
    } catch (error) {
      console.error("Erro ao carregar telejornais:", error);
      toast({
        title: "Erro ao carregar telejornais",
        description: "Não foi possível carregar a lista de telejornais",
        variant: "destructive"
      });
    }
  };

  const loadClosedSnapshots = async () => {
    setIsLoading(true);
    try {
      console.log("Carregando espelhos com filtros:", {
        selectedJornal,
        selectedDate,
        selectedTime,
        startTime,
        endTime,
        showTimeRange
      });

      // Processar a data selecionada corretamente para evitar problemas de timezone
      let processedDate: Date | undefined = undefined;
      if (selectedDate) {
        // Criar uma nova data usando apenas ano, mês e dia para evitar problemas de timezone
        processedDate = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate()
        );
        console.log("Original selected date:", selectedDate);
        console.log("Processed date for query:", processedDate);
      }

      // Usar valores corretos baseados no modo de horário
      const timeFilter = selectedTime || undefined;
      const startTimeFilter = showTimeRange ? startTime || undefined : undefined;
      const endTimeFilter = showTimeRange ? endTime || undefined : undefined;

      const data = await fetchClosedRundownSnapshots(
        selectedJornal === "all" ? undefined : selectedJornal, 
        processedDate, 
        timeFilter,
        startTimeFilter,
        endTimeFilter
      );
      
      setClosedSnapshots(data);
      
      console.log(`Encontrados ${data.length} espelhos fechados com os filtros aplicados`);
      
      if (data.length === 0 && (selectedJornal !== "all" || selectedDate || selectedTime || startTime || endTime)) {
        console.log("Nenhum resultado encontrado com os filtros selecionados");
      }
    } catch (error) {
      console.error("Erro ao carregar espelhos fechados:", error);
      toast({
        title: "Erro ao carregar espelhos",
        description: "Não foi possível carregar os espelhos fechados",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl h-auto max-h-[90vh] overflow-hidden flex flex-col">
        <div className="border-b pb-4 mb-4">
          <h2 className="text-lg font-semibold">Espelho Geral - Histórico de Espelhos</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Visualize todos os espelhos fechados do sistema. Use os filtros abaixo para refinar sua busca.
          </p>
        </div>
        
        <FilterSection 
          telejornais={telejornais}
          selectedJornal={selectedJornal}
          setSelectedJornal={setSelectedJornal}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedTime={selectedTime}
          setSelectedTime={setSelectedTime}
          startTime={startTime}
          setStartTime={setStartTime}
          endTime={endTime}
          setEndTime={setEndTime}
          showTimeRange={showTimeRange}
          setShowTimeRange={setShowTimeRange}
        />
        
        <div className="overflow-auto flex-grow">
          <ClosedRundownContent 
            snapshots={closedSnapshots}
            isLoading={isLoading}
            telejornais={telejornais}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
