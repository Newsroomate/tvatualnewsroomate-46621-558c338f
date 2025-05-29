
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { fetchClosedRundowns, ClosedRundown } from "@/services/espelhos-api";
import { RundownTable } from "./general-schedule/RundownTable";
import { ReadOnlyView } from "./general-schedule/ReadOnlyView";

interface ClosedRundownsViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  telejornalId: string;
  selectedDate: Date;
  telejornalName: string;
}

export const ClosedRundownsViewModal = ({
  isOpen,
  onClose,
  telejornalId,
  selectedDate,
  telejornalName
}: ClosedRundownsViewModalProps) => {
  const [closedRundowns, setClosedRundowns] = useState<ClosedRundown[]>([]);
  const [selectedRundown, setSelectedRundown] = useState<ClosedRundown | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadClosedRundowns();
    }
  }, [isOpen, telejornalId, selectedDate]);

  const loadClosedRundowns = async () => {
    setIsLoading(true);
    try {
      const data = await fetchClosedRundowns(telejornalId, selectedDate);
      
      setClosedRundowns(data);
      
      if (data.length === 0) {
        toast({
          title: "Nenhum espelho encontrado",
          description: `Não há espelhos fechados para ${telejornalName} na data ${format(selectedDate, 'dd/MM/yyyy')}`,
        });
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

  const handleVisualizarEspelho = (rundown: ClosedRundown) => {
    setSelectedRundown(rundown);
  };

  const handleCloseRundownView = () => {
    setSelectedRundown(null);
  };

  const handleMainClose = () => {
    setSelectedRundown(null);
    onClose();
  };

  if (selectedRundown) {
    return (
      <Dialog open={isOpen} onOpenChange={handleMainClose}>
        <DialogContent className="sm:max-w-6xl h-auto max-h-[90vh] overflow-hidden flex flex-col">
          <ReadOnlyView 
            selectedRundown={selectedRundown}
            onClose={handleCloseRundownView}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleMainClose}>
      <DialogContent className="sm:max-w-4xl h-auto max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Espelhos Fechados - {telejornalName} - {format(selectedDate, 'dd/MM/yyyy')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          <RundownTable
            isLoading={isLoading}
            filteredRundowns={closedRundowns}
            onVisualizarEspelho={handleVisualizarEspelho}
            onClose={handleMainClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
