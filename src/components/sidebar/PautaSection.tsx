
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit2, Trash2, FileText } from "lucide-react";
import { Pauta } from "@/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EditPautaDialog } from "@/components/EditPautaDialog";
import { deletePauta } from "@/services/pautas-api";
import { useToast } from "@/hooks/use-toast";
import { generatePautaPDF } from "@/utils/pdf-utils";

interface PautaSectionProps {
  pautas: Pauta[];
  onAddPauta: () => void;
  isLoading: boolean;
  onDataChange: () => void;
}

export const PautaSection = ({
  pautas,
  onAddPauta,
  isLoading,
  onDataChange
}: PautaSectionProps) => {
  const [editingPauta, setEditingPauta] = useState<Pauta | null>(null);
  const [deletingPauta, setDeletingPauta] = useState<Pauta | null>(null);
  const { toast } = useToast();

  const handleEditPauta = (pauta: Pauta, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPauta(pauta);
  };

  const handleDeletePauta = (pauta: Pauta, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingPauta(pauta);
  };

  const handlePrintPauta = (pauta: Pauta, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      generatePautaPDF(pauta);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao gerar o PDF. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const confirmDeletePauta = async () => {
    if (!deletingPauta) return;
    try {
      await deletePauta(deletingPauta.id);
      onDataChange();
    } catch (error) {
      console.error("Erro ao excluir pauta:", error);
      toast({
        title: "Erro ao excluir pauta",
        description: "Ocorreu um erro ao excluir a pauta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDeletingPauta(null);
    }
  };
  
  return (
    <div className="p-4 border-t border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold uppercase text-gray-500">Pautas</h3>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onAddPauta}>
          <PlusCircle className="h-4 w-4" />
          <span className="sr-only">Adicionar Pauta</span>
        </Button>
      </div>
      
      {isLoading ? (
        <p className="text-sm text-gray-500">Carregando...</p>
      ) : (
        <ul className="space-y-1">
          {pautas.map(pauta => (
            <li key={pauta.id} className="relative group">
              <Button variant="ghost" className="w-full justify-start text-left pr-24">
                {pauta.titulo}
              </Button>
              <div className="absolute top-1 right-1 hidden group-hover:flex space-x-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => handlePrintPauta(pauta, e)}>
                  <FileText className="h-4 w-4" />
                  <span className="sr-only">Imprimir PDF</span>
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => handleEditPauta(pauta, e)}>
                  <Edit2 className="h-4 w-4" />
                  <span className="sr-only">Editar</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-red-500 hover:text-red-700" 
                  onClick={e => handleDeletePauta(pauta, e)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Excluir</span>
                </Button>
              </div>
            </li>
          ))}
          {pautas.length === 0 && <p className="text-sm text-gray-500 italic">Nenhuma pauta disponível</p>}
        </ul>
      )}

      {/* Edit Pauta Dialog */}
      {editingPauta && (
        <EditPautaDialog 
          isOpen={!!editingPauta} 
          onClose={() => setEditingPauta(null)} 
          pauta={editingPauta} 
          onPautaUpdated={onDataChange}
        />
      )}
      
      {/* Delete Pauta Confirmation */}
      <AlertDialog open={!!deletingPauta} onOpenChange={() => setDeletingPauta(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta pauta?
              <br />
              <strong className="text-destructive">{deletingPauta?.titulo}</strong>
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePauta} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
