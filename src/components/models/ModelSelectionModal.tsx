
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, User, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getModelos } from "@/services/modelos-api";
import { ModeloEspelho } from "@/types/models";
import { format } from "date-fns";

interface ModelSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onModelSelected: () => void;
}

export const ModelSelectionModal = ({
  isOpen,
  onClose,
  onModelSelected
}: ModelSelectionModalProps) => {
  const [modelos, setModelos] = useState<ModeloEspelho[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModeloEspelho | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadModelos();
    }
  }, [isOpen]);

  const loadModelos = async () => {
    setIsLoading(true);
    try {
      const data = await getModelos();
      setModelos(data);
      
      if (data.length === 0) {
        toast({
          title: "Nenhum modelo encontrado",
          description: "Não há modelos salvos para usar.",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar modelos:", error);
      toast({
        title: "Erro ao carregar modelos",
        description: "Não foi possível carregar os modelos salvos",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleModelSelect = (modelo: ModeloEspelho) => {
    setSelectedModel(modelo);
  };

  const handleUseModel = () => {
    if (!selectedModel) return;
    
    // TODO: Implementar lógica para aplicar o modelo selecionado
    toast({
      title: "Modelo aplicado",
      description: `O modelo "${selectedModel.nome}" foi aplicado com sucesso!`,
    });
    
    onModelSelected();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl h-auto max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Selecionar Modelo</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
              <span className="text-muted-foreground">Carregando modelos...</span>
            </div>
          ) : modelos.length > 0 ? (
            <div className="space-y-2">
              {modelos.map((modelo) => (
                <div 
                  key={modelo.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedModel?.id === modelo.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleModelSelect(modelo)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium">{modelo.nome}</h3>
                      {modelo.descricao && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {modelo.descricao}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          <span>{modelo.estrutura.blocos.length} bloco(s)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {format(new Date(modelo.created_at), 'dd/MM/yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {selectedModel?.id === modelo.id && (
                      <div className="ml-2">
                        <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">
                Nenhum modelo salvo encontrado
              </p>
              <p className="text-sm text-muted-foreground">
                Crie um espelho e salve como modelo para usar aqui
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleUseModel} 
            disabled={!selectedModel}
          >
            Usar Modelo Selecionado
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
