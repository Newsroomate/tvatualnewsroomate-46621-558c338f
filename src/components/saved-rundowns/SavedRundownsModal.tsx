
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { fetchTelejornais } from "@/services/api";
import { Telejornal } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useSavedRundowns } from "@/hooks/useSavedRundowns";

import { FilterSection } from "../general-schedule/FilterSection";
import { SavedRundownTable } from "./SavedRundownTable";
import { SavedRundownReadOnlyView } from "./SavedRundownReadOnlyView";
import { SavedRundown } from "@/services/saved-rundowns-api";

interface SavedRundownsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SavedRundownsModal = ({ isOpen, onClose }: SavedRundownsModalProps) => {
  const [telejornais, setTelejornais] = useState<Telejornal[]>([]);
  const [selectedJornal, setSelectedJornal] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [showTimeRange, setShowTimeRange] = useState<boolean>(false);
  const [isReadOnlyMode, setIsReadOnlyMode] = useState<boolean>(false);
  const [selectedRundown, setSelectedRundown] = useState<SavedRundown | null>(null);
  
  const { toast } = useToast();
  const { savedRundowns, isLoading, loadSavedRundownsByDate, loadSavedRundown } = useSavedRundowns();

  useEffect(() => {
    if (isOpen) {
      loadTelejornais();
      loadSavedRundowns();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadSavedRundowns();
    }
  }, [selectedJornal, selectedDate, isOpen]);

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

  const loadSavedRundowns = async () => {
    try {
      await loadSavedRundownsByDate(
        selectedJornal === "all" ? undefined : selectedJornal,
        selectedDate
      );
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleVisualizarEspelho = async (rundownDisplay: any) => {
    try {
      const fullRundown = await loadSavedRundown(rundownDisplay.id);
      if (fullRundown) {
        setSelectedRundown(fullRundown);
        setIsReadOnlyMode(true);
      }
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const closeReadOnlyMode = () => {
    setIsReadOnlyMode(false);
    setSelectedRundown(null);
  };

  if (isReadOnlyMode && selectedRundown) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl h-auto max-h-[80vh] overflow-hidden flex flex-col">
          <SavedRundownReadOnlyView 
            selectedRundown={selectedRundown} 
            onClose={closeReadOnlyMode} 
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
        
        <SavedRundownTable 
          isLoading={isLoading}
          savedRundowns={savedRundowns}
          onVisualizarEspelho={handleVisualizarEspelho}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};
