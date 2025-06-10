
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
      // Carregar espelhos sem filtro de data inicialmente para mostrar histórico
      loadClosedSnapshots();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadClosedSnapshots();
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
      const data = await fetchClosedRundownSnapshots(
        selectedJornal === "all" ? undefined : selectedJornal, 
        selectedDate, 
        selectedTime,
        showTimeRange ? startTime : undefined,
        showTimeRange ? endTime : undefined
      );
      
      setClosedSnapshots(data);
      
      if (data.length === 0) {
        console.log("Nenhum espelho fechado encontrado com os filtros selecionados");
      } else {
        console.log(`Encontrados ${data.length} espelhos fechados`);
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
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
