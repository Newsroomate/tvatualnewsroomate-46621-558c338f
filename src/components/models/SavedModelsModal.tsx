
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { fetchAllSavedModels, deleteSavedModel, SavedModel } from "@/services/models-api";
import { Loader2, Trash2, FileText, Eye } from "lucide-react";
import { format } from "date-fns";

interface SavedModelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseModel?: (model: SavedModel) => void;
}

export const SavedModelsModal = ({
  isOpen,
  onClose,
  onUseModel
}: SavedModelsModalProps) => {
  const [models, setModels] = useState<SavedModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<SavedModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadModels();
    }
  }, [isOpen]);

  const loadModels = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllSavedModels();
      setModels(data);
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

  const handleDeleteModel = async (modelId: string) => {
    setIsDeleting(modelId);
    try {
      await deleteSavedModel(modelId);
      setModels(models.filter(m => m.id !== modelId));
      toast({
        title: "Modelo excluído",
        description: "O modelo foi excluído com sucesso",
      });
    } catch (error) {
      console.error("Erro ao excluir modelo:", error);
      toast({
        title: "Erro ao excluir modelo",
        description: "Não foi possível excluir o modelo",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleUseModel = (model: SavedModel) => {
    if (onUseModel) {
      onUseModel(model);
      onClose();
    }
  };

  const handleViewDetails = (model: SavedModel) => {
    setSelectedModel(model);
  };

  if (selectedModel) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Detalhes do Modelo: {selectedModel.nome}</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto space-y-4">
            {selectedModel.descricao && (
              <div>
                <h4 className="font-medium mb-2">Descrição</h4>
                <p className="text-sm text-muted-foreground">{selectedModel.descricao}</p>
              </div>
            )}
            
            <div>
              <h4 className="font-medium mb-2">Estrutura</h4>
              <div className="space-y-2">
                {selectedModel.estrutura.blocos.map((bloco, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <h5 className="font-medium">{bloco.nome}</h5>
                    <p className="text-sm text-muted-foreground">
                      {bloco.items.length} matéria(s)
                    </p>
                    {bloco.items.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {bloco.items.slice(0, 3).map((item, itemIndex) => (
                          <div key={itemIndex} className="text-xs text-muted-foreground">
                            • {item.retranca}
                          </div>
                        ))}
                        {bloco.items.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            ... e mais {bloco.items.length - 3} matéria(s)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setSelectedModel(null)}
            >
              Voltar
            </Button>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => handleDeleteModel(selectedModel.id)}
                disabled={isDeleting === selectedModel.id}
              >
                {isDeleting === selectedModel.id && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
              <Button
                onClick={() => handleUseModel(selectedModel)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Usar Modelo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Modelos Salvos</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
              <span className="text-muted-foreground">Carregando modelos...</span>
            </div>
          ) : models.length > 0 ? (
            <div className="space-y-2">
              {models.map((model) => (
                <div 
                  key={model.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium">{model.nome}</h3>
                      {model.descricao && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {model.descricao}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>
                          {model.estrutura.blocos.length} bloco(s)
                        </span>
                        <span>
                          Criado em: {format(new Date(model.created_at), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(model)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteModel(model.id)}
                        disabled={isDeleting === model.id}
                      >
                        {isDeleting === model.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUseModel(model)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Usar Modelo
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum modelo salvo encontrado</p>
              <p className="text-sm text-muted-foreground">
                Salve um modelo para reutilizar estruturas de espelhos
              </p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end border-t pt-4">
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
