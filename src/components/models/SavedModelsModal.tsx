
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, FileText, Calendar, User } from "lucide-react";
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
    } catch (error) {
      console.error("Erro ao excluir modelo:", error);
    }
  };

  const handleSelect = (modelo: ModeloEspelho) => {
    onSelectModel(modelo);
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modelos Salvos</DialogTitle>
          </DialogHeader>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-500">Carregando modelos...</div>
            </div>
          ) : modelos.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum modelo salvo encontrado</p>
              <p className="text-sm text-gray-400 mt-2">
                Salve um modelo para reutilizar estruturas de espelho
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {modelos.map((modelo) => (
                <div
                  key={modelo.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-lg">{modelo.nome}</h3>
                      {modelo.descricao && (
                        <p className="text-gray-600 text-sm mt-1">{modelo.descricao}</p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(modelo.created_at || '')}
                        </div>
                        <Badge variant="outline">
                          {modelo.estrutura.blocos.length} bloco(s)
                        </Badge>
                        <Badge variant="outline">
                          {modelo.estrutura.blocos.reduce((total, bloco) => total + bloco.items.length, 0)} matéria(s)
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setModeloToDelete(modelo);
                          setDeleteConfirmOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSelect(modelo)}
                      >
                        Usar Modelo
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-end pt-4">
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
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
