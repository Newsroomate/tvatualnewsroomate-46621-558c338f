
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { fetchTelejornais } from "@/services/api";
import { Telejornal } from "@/types";
import { ClosedRundown, fetchClosedRundowns } from "@/services/espelhos-api";
import { useToast } from "@/hooks/use-toast";

import { FilterSection } from "./FilterSection";
import { RundownTable } from "./RundownTable";
import { ReadOnlyView } from "./ReadOnlyView";

interface GeneralScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GeneralScheduleModal = ({ isOpen, onClose }: GeneralScheduleModalProps) => {
  const [telejornais, setTelejornais] = useState<Telejornal[]>([]);
  const [selectedJornal, setSelectedJornal] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [showTimeRange, setShowTimeRange] = useState<boolean>(false);
  const [closedRundowns, setClosedRundowns] = useState<ClosedRundown[]>([]);
  const [filteredRundowns, setFilteredRundowns] = useState<ClosedRundown[]>([]);
  const [isReadOnlyMode, setIsReadOnlyMode] = useState<boolean>(false);
  const [selectedRundown, setSelectedRundown] = useState<ClosedRundown | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadTelejornais();
      loadClosedRundowns();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadClosedRundowns();
    }
  }, [selectedJornal, selectedDate, selectedTime, startTime, endTime, showTimeRange, isOpen]);

  const loadTelejornais = async () => {
    try {
      const data = await fetchTelejornais();
      setTelejornais(data);
      if (data.length > 0 && !selectedJornal) {
        setSelectedJornal("all");
      }
    } catch (error) {
      console.error("Erro ao carregar telejornais:", error);
      toast({
        title: "Erro ao carregar telejornais",
        description: "Não foi possível carregar a lista de telejornais",
        variant: "destructive"
      });
    }
  };

  const loadClosedRundowns = async () => {
    setIsLoading(true);
    try {
      const data = await fetchClosedRundowns(
        selectedJornal === "all" ? undefined : selectedJornal, 
        selectedDate, 
        selectedTime,
        showTimeRange ? startTime : undefined,
        showTimeRange ? endTime : undefined
      );
      
      setClosedRundowns(data);
      setFilteredRundowns(data);
      
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

  const handleVisualizarEspelho = async (rundown: ClosedRundown) => {
    setSelectedRundown(rundown);
    setIsReadOnlyMode(true);
  };

  const closeReadOnlyMode = () => {
    setIsReadOnlyMode(false);
    setSelectedRundown(null);
  };

  // Modified to prevent closing the modal when in read-only mode
  const handleDialogChange = (open: boolean) => {
    if (!open && !isReadOnlyMode) {
      onClose();
    }
  };

  if (isReadOnlyMode && selectedRundown) {
    return (
      <Dialog open={isOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-4xl h-auto max-h-[80vh] overflow-hidden flex flex-col">
          <ReadOnlyView 
            selectedRundown={selectedRundown} 
            onClose={closeReadOnlyMode} 
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-4xl h-auto max-h-[80vh] overflow-hidden flex flex-col">
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
        
        <RundownTable 
          isLoading={isLoading}
          filteredRundowns={filteredRundowns}
          onVisualizarEspelho={handleVisualizarEspelho}
        />
      </DialogContent>
    </Dialog>
  );
};
