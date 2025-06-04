
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchModelos, deleteModelo } from "@/services/models-api";
import { EspelhoModelo } from "@/types/models";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ModelSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModel: (modelo: EspelhoModelo) => void;
}

export const ModelSelectionModal = ({
  isOpen,
  onClose,
  onSelectModel
}: ModelSelectionModalProps) => {
  const [selectedModel, setSelectedModel] = useState<EspelhoModelo | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: modelos = [], isLoading } = useQuery({
    queryKey: ['modelos'],
    queryFn: fetchModelos,
    enabled: isOpen
  });

  const deleteMutation = useMutation({
    mutationFn: deleteModelo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelos'] });
      toast({
        title: "Modelo excluído",
        description: "O modelo foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao excluir modelo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o modelo.",
        variant: "destructive",
      });
    }
  });

  const handleSelectModel = () => {
    if (selectedModel) {
      onSelectModel(selectedModel);
      onClose();
    }
  };

  const handleDeleteModel = (e: React.MouseEvent, modeloId: string) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este modelo?')) {
      deleteMutation.mutate(modeloId);
    }
  };

  const canDeleteModel = (modelo: EspelhoModelo) => {
    return user?.id === modelo.user_id;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Selecionar Modelo</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Carregando modelos...</span>
            </div>
          ) : modelos.length === 0 ? (
            <div className="text-center text-muted-foreground h-32 flex items-center justify-center">
              <div>
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum modelo salvo encontrado</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="space-y-3">
                {modelos.map((modelo) => (
                  <Card 
                    key={modelo.id}
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedModel?.id === modelo.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedModel(modelo)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{modelo.nome}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {modelo.estrutura.blocos.length} bloco(s)
                          </Badge>
                          {canDeleteModel(modelo) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDeleteModel(e, modelo.id)}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <CardDescription className="text-xs">
                        Criado em {format(new Date(modelo.created_at), 'dd/MM/yyyy HH:mm')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-sm text-muted-foreground">
                        {modelo.estrutura.blocos.reduce((total, bloco) => total + bloco.materias.length, 0)} matéria(s) total
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
          
          <div className="flex justify-between">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSelectModel} 
              disabled={!selectedModel}
            >
              Usar Modelo Selecionado
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
