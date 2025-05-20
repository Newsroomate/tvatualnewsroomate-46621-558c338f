
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit2, Trash2 } from "lucide-react";
import { Telejornal } from "@/types";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EditTelejornalDialog } from "@/components/EditTelejornalDialog";
import { deleteTelejornal } from "@/services/api";

interface TelejornalSectionProps {
  telejornais: Telejornal[];
  selectedJournal: string | null;
  onSelectJournal: (journalId: string) => void;
  onAddTelejornal: () => void;
  isLoading: boolean;
  onDataChange: () => void;
}

export const TelejornalSection = ({
  telejornais,
  selectedJournal,
  onSelectJournal,
  onAddTelejornal,
  isLoading,
  onDataChange
}: TelejornalSectionProps) => {
  const [editingTelejornal, setEditingTelejornal] = useState<Telejornal | null>(null);
  const [deletingTelejornal, setDeletingTelejornal] = useState<Telejornal | null>(null);

  const handleEditTelejornal = (telejornal: Telejornal, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTelejornal(telejornal);
  };

  const handleDeleteTelejornal = (telejornal: Telejornal, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingTelejornal(telejornal);
  };

  const confirmDeleteTelejornal = async () => {
    if (!deletingTelejornal) return;
    try {
      await deleteTelejornal(deletingTelejornal.id);
      
      // If the deleted telejornal was selected, select the first one in the list
      if (selectedJournal === deletingTelejornal.id) {
        const remainingTelejornais = telejornais.filter(tj => tj.id !== deletingTelejornal.id);
        if (remainingTelejornais.length > 0) {
          onSelectJournal(remainingTelejornais[0].id);
        } else {
          onSelectJournal("");
        }
      }
      
      onDataChange();
    } catch (error) {
      console.error("Erro ao excluir telejornal:", error);
    } finally {
      setDeletingTelejornal(null);
    }
  };

  const handleSelectTelejornal = async (journalId: string) => {
    if (journalId === selectedJournal) return;
    onSelectJournal(journalId);
  };
  
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold uppercase text-gray-500">Telejornais</h3>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onAddTelejornal}>
          <PlusCircle className="h-4 w-4" />
          <span className="sr-only">Adicionar Telejornal</span>
        </Button>
      </div>
      
      {isLoading ? (
        <p className="text-sm text-gray-500">Carregando...</p>
      ) : (
        <ul className="space-y-1">
          {telejornais.map(jornal => (
            <li key={jornal.id} className="relative group">
              <Button 
                variant={selectedJournal === jornal.id ? "secondary" : "ghost"} 
                className={`w-full justify-start text-left pr-16 ${jornal.espelho_aberto ? 'border-l-4 border-green-500 pl-3' : ''}`}
                onClick={() => handleSelectTelejornal(jornal.id)}
              >
                <span className="truncate">{jornal.nome}</span>
                {jornal.espelho_aberto && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="ml-2 h-2 w-2 rounded-full bg-green-500" />
                      </TooltipTrigger>
                      <TooltipContent>Espelho aberto</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </Button>
              <div className="absolute top-1 right-1 hidden group-hover:flex space-x-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => handleEditTelejornal(jornal, e)}>
                  <Edit2 className="h-4 w-4" />
                  <span className="sr-only">Editar</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-red-500 hover:text-red-700" 
                  onClick={e => handleDeleteTelejornal(jornal, e)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Excluir</span>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Edit Telejornal Dialog */}
      {editingTelejornal && (
        <EditTelejornalDialog 
          isOpen={!!editingTelejornal} 
          onClose={() => setEditingTelejornal(null)} 
          telejornal={editingTelejornal} 
          onTelejornalUpdated={onDataChange}
        />
      )}
      
      {/* Delete Telejornal Confirmation */}
      <AlertDialog open={!!deletingTelejornal} onOpenChange={() => setDeletingTelejornal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este telejornal?
              <br />
              <strong className="text-destructive">{deletingTelejornal?.nome}</strong>
              <br />
              Esta ação não pode ser desfeita e excluirá todos os blocos e matérias associados a este telejornal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTelejornal} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
