
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { fetchClosedRundownSnapshots, ClosedRundownSnapshot } from "@/services/snapshots-api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ClosedRundownContent } from "./general-schedule/ClosedRundownContent";

interface ClosedRundownsViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  telejornalId: string;
  selectedDate: Date | undefined;
}

export const ClosedRundownsViewModal = ({
  isOpen,
  onClose,
  telejornalId,
  selectedDate
}: ClosedRundownsViewModalProps) => {
  const [closedSnapshots, setClosedSnapshots] = useState<ClosedRundownSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && selectedDate && telejornalId) {
      loadClosedSnapshots();
    }
  }, [isOpen, selectedDate, telejornalId]);

  const loadClosedSnapshots = async () => {
    if (!selectedDate || !telejornalId) return;
    
    setIsLoading(true);
    try {
      const data = await fetchClosedRundownSnapshots(
        telejornalId,
        selectedDate
      );
      
      setClosedSnapshots(data);
      
      if (data.length === 0) {
        toast({
          title: "Nenhum espelho fechado encontrado",
          description: `Não há espelhos fechados para a data ${format(selectedDate, 'dd/MM/yyyy')}`,
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl h-auto max-h-[80vh] overflow-hidden flex flex-col">
        <div className="border-b pb-4 mb-4">
          <h2 className="text-lg font-semibold">
            Espelhos Fechados - {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : ''}
          </h2>
        </div>
        
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
