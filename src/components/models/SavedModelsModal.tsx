
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, FileText, Calendar, Eye } from "lucide-react";
import { ModeloEspelho } from "@/types/modelos-espelho";
import { fetchModelosEspelho, deleteModeloEspelho } from "@/services/modelos-espelho-api";
import { Telejornal } from "@/types";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SavedModelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTelejornal: Telejornal | null;
  onSelectModel: (modelo: ModeloEspelho) => void;
}

export const SavedModelsModal = ({
  isOpen,
  onClose,
  currentTelejornal,
  onSelectModel
}: SavedModelsModalProps) => {
  const [modelos, setModelos] = useState<ModeloEspelho[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [modeloToDelete, setModeloToDelete] = useState<ModeloEspelho | null>(null);
  const [selectedModelPreview, setSelectedModelPreview] = useState<ModeloEspelho | null>(null);
  const { toast } = useToast();

  const loadModelos = async () => {
    setIsLoading(true);
    try {
      const data = await fetchModelosEspelho(currentTelejornal?.id);
      setModelos(data);
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

  useEffect(() => {
    if (isOpen) {
      loadModelos();
    }
  }, [isOpen, currentTelejornal?.id]);

  const handleDelete = async () => {
    if (!modeloToDelete) return;

    try {
      await deleteModeloEspelho(modeloToDelete.id);
      setModelos(prev => prev.filter(m => m.id !== modeloToDelete.id));
      setDeleteConfirmOpen(false);
      setModeloToDelete(null);
      toast({
        title: "Modelo excluído",
        description: `O modelo "${modeloToDelete.nome}" foi excluído com sucesso`,
      });
    } catch (error) {
      console.error("Erro ao excluir modelo:", error);
    }
  };

  const handleUseModel = (modelo: ModeloEspelho) => {
    console.log("Usando modelo:", modelo.nome);
    onSelectModel(modelo);
    toast({
      title: "Modelo aplicado",
      description: `O modelo "${modelo.nome}" foi aplicado ao novo espelho`,
    });
    onClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalMaterias = (modelo: ModeloEspelho) => {
    return modelo.estrutura.blocos.reduce((total, bloco) => total + bloco.items.length, 0);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Modelos de Espelho Salvos
            </DialogTitle>
          </DialogHeader>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-500">Carregando modelos...</div>
            </div>
          ) : modelos.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum modelo encontrado</h3>
              <p className="text-gray-500 mb-4">
                Ainda não há modelos salvos para este telejornal
              </p>
              <p className="text-sm text-gray-400">
                Salve um modelo para reutilizar estruturas de espelho no futuro
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Selecione um modelo para criar um novo espelho ou gerencie seus modelos salvos:
              </div>
              
              {modelos.map((modelo) => (
                <div
                  key={modelo.id}
                  className="border rounded-lg p-6 hover:bg-gray-50 transition-all duration-200"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">{modelo.nome}</h3>
                        <Badge variant="secondary" className="text-xs">
                          Modelo
                        </Badge>
                      </div>
                      
                      {modelo.descricao && (
                        <p className="text-gray-600 text-sm mb-3">{modelo.descricao}</p>
                      )}
                      
                      <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Criado em {formatDate(modelo.created_at || '')}
                        </div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {modelo.estrutura.blocos.length} bloco(s)
                        </Badge>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {getTotalMaterias(modelo)} matéria(s)
                        </Badge>
                      </div>

                      {selectedModelPreview?.id === modelo.id && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                          <h4 className="font-medium text-sm text-gray-700 mb-2">Estrutura do Modelo:</h4>
                          <div className="space-y-2">
                            {modelo.estrutura.blocos.map((bloco, index) => (
                              <div key={bloco.id} className="text-xs text-gray-600">
                                <span className="font-medium">
                                  {index + 1}. {bloco.nome}
                                </span>
                                <span className="text-gray-500 ml-2">
                                  ({bloco.items.length} matéria{bloco.items.length !== 1 ? 's' : ''})
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedModelPreview(
                            selectedModelPreview?.id === modelo.id ? null : modelo
                          );
                        }}
                        className="text-gray-600"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {selectedModelPreview?.id === modelo.id ? 'Ocultar' : 'Preview'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setModeloToDelete(modelo);
                          setDeleteConfirmOpen(true);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => handleUseModel(modelo)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Usar Modelo
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-end pt-6 border-t">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o modelo "{modeloToDelete?.nome}"? 
              Esta ação não pode ser desfeita e o modelo será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
            >
              Excluir Modelo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
