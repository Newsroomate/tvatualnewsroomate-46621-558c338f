
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SavedRundown } from "@/types/saved-rundowns";
import { fetchSavedRundownsByDate } from "@/services/saved-rundowns-api";
import { useToast } from "@/hooks/use-toast";
import { SavedRundownView } from "./SavedRundownView";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SavedRundownsModalProps {
  isOpen: boolean;
  onClose: () => void;
  telejornalId: string;
  targetDate: Date;
}

export const SavedRundownsModal = ({
  isOpen,
  onClose,
  telejornalId,
  targetDate
}: SavedRundownsModalProps) => {
  const [savedRundowns, setSavedRundowns] = useState<SavedRundown[]>([]);
  const [selectedRundown, setSelectedRundown] = useState<SavedRundown | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadSavedRundowns();
    }
  }, [isOpen, telejornalId, targetDate]);

  const loadSavedRundowns = async () => {
    setIsLoading(true);
    try {
      // Processar a data corretamente para evitar problemas de timezone
      const processedDate = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate()
      );
      
      const year = processedDate.getFullYear();
      const month = String(processedDate.getMonth() + 1).padStart(2, '0');
      const day = String(processedDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      console.log("Loading saved rundowns for date:", dateString);
      
      const data = await fetchSavedRundownsByDate(telejornalId, dateString);
      setSavedRundowns(data);
      
      if (data.length === 0) {
        toast({
          title: "Nenhum espelho encontrado",
          description: `Não há espelhos salvos para a data ${format(targetDate, 'dd/MM/yyyy', { locale: ptBR })}`,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar espelhos salvos:", error);
      toast({
        title: "Erro ao carregar espelhos",
        description: "Não foi possível carregar os espelhos salvos",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewRundown = (rundown: SavedRundown) => {
    setSelectedRundown(rundown);
  };

  const handleCloseRundownView = () => {
    setSelectedRundown(null);
  };

  if (selectedRundown) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl h-auto max-h-[80vh] overflow-hidden flex flex-col">
          <SavedRundownView 
            savedRundown={selectedRundown}
            onClose={handleCloseRundownView}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl h-auto max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex flex-col h-full">
          <div className="border-b pb-4 mb-4">
            <h2 className="text-lg font-semibold">
              Espelhos de {format(targetDate, 'dd/MM/yyyy', { locale: ptBR })}
            </h2>
          </div>
          
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                <span className="text-muted-foreground">Carregando espelhos...</span>
              </div>
            ) : savedRundowns.length > 0 ? (
              <div className="space-y-2">
                {savedRundowns.map((rundown) => {
                  // Garantir que a data seja exibida corretamente
                  const displayDate = new Date(rundown.data_referencia + 'T00:00:00');
                  const saveDate = new Date(rundown.data_salvamento);
                  
                  return (
                    <div 
                      key={rundown.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleViewRundown(rundown)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{rundown.nome}</h3>
                          <p className="text-sm text-muted-foreground">
                            Data do espelho: {format(displayDate, 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Salvo em: {format(saveDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Visualizar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40">
                <p className="text-muted-foreground">
                  Nenhum espelho salvo encontrado para esta data
                </p>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex justify-end border-t pt-4">
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
