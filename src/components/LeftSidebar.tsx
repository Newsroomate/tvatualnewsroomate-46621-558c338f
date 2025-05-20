
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit2, Trash2, FileText } from "lucide-react";
import { fetchTelejornais, fetchPautas, deleteTelejornal, deletePauta, fetchTelejornal } from "@/services/api";
import { Telejornal, Pauta } from "@/types";
import { GeneralScheduleModal } from "./GeneralScheduleModal";
import { PautaModal } from "./PautaModal";
import { TelejornalModal } from "./TelejornalModal";
import { EditTelejornalDialog } from "./EditTelejornalDialog";
import { EditPautaDialog } from "./EditPautaDialog";
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
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LeftSidebarProps {
  selectedJournal: string | null;
  onSelectJournal: (journalId: string) => void;
}

export const LeftSidebar = ({ selectedJournal, onSelectJournal }: LeftSidebarProps) => {
  const [isGeneralScheduleOpen, setIsGeneralScheduleOpen] = useState(false);
  const [isPautaModalOpen, setIsPautaModalOpen] = useState(false);
  const [isTelejornalModalOpen, setIsTelejornalModalOpen] = useState(false);
  const [telejornais, setTelejornais] = useState<Telejornal[]>([]);
  const [pautas, setPautas] = useState<Pauta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Edit dialog states
  const [editingTelejornal, setEditingTelejornal] = useState<Telejornal | null>(null);
  const [editingPauta, setEditingPauta] = useState<Pauta | null>(null);
  
  // Delete confirmation dialog states
  const [deletingTelejornal, setDeletingTelejornal] = useState<Telejornal | null>(null);
  const [deletingPauta, setDeletingPauta] = useState<Pauta | null>(null);
  
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [jornaisData, pautasData] = await Promise.all([
        fetchTelejornais(),
        fetchPautas()
      ]);
      
      setTelejornais(jornaisData);
      setPautas(pautasData);
      
      // Se não houver jornal selecionado e existirem jornais, selecionar o primeiro
      if (!selectedJournal && jornaisData.length > 0) {
        onSelectJournal(jornaisData[0].id);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenGeneralSchedule = () => {
    setIsGeneralScheduleOpen(true);
  };

  const handleOpenPautaModal = () => {
    setIsPautaModalOpen(true);
  };
  
  const handleOpenTelejornalModal = () => {
    setIsTelejornalModalOpen(true);
  };
  
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
      loadData();
      
      // If the deleted telejornal was selected, select the first one in the list
      if (selectedJournal === deletingTelejornal.id) {
        const remainingTelejornais = telejornais.filter(tj => tj.id !== deletingTelejornal.id);
        if (remainingTelejornais.length > 0) {
          onSelectJournal(remainingTelejornais[0].id);
        } else {
          onSelectJournal("");
        }
      }
    } catch (error) {
      console.error("Erro ao excluir telejornal:", error);
    } finally {
      setDeletingTelejornal(null);
    }
  };
  
  const handleEditPauta = (pauta: Pauta, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPauta(pauta);
  };
  
  const handleDeletePauta = (pauta: Pauta, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingPauta(pauta);
  };
  
  const confirmDeletePauta = async () => {
    if (!deletingPauta) return;
    
    try {
      await deletePauta(deletingPauta.id);
      loadData();
    } catch (error) {
      console.error("Erro ao excluir pauta:", error);
    } finally {
      setDeletingPauta(null);
    }
  };

  const handleSelectTelejornal = async (journalId: string) => {
    if (journalId === selectedJournal) return;
    onSelectJournal(journalId);
  };

  return (
    <div className="w-64 bg-gray-100 h-full border-r border-gray-200 flex flex-col">
      <div className="p-4 bg-primary text-primary-foreground">
        <h2 className="text-lg font-semibold">Redação TJ</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {/* Telejornais Section */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold uppercase text-gray-500">Telejornais</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={handleOpenTelejornalModal}
            >
              <PlusCircle className="h-4 w-4" />
              <span className="sr-only">Adicionar Telejornal</span>
            </Button>
          </div>
          {isLoading ? (
            <p className="text-sm text-gray-500">Carregando...</p>
          ) : (
            <ul className="space-y-1">
              {telejornais.map((jornal) => (
                <li key={jornal.id} className="relative group">
                  <Button
                    variant={selectedJournal === jornal.id ? "secondary" : "ghost"}
                    className={`w-full justify-start text-left pr-16 ${jornal.is_open ? 'border-l-4 border-green-500 pl-3' : ''}`}
                    onClick={() => handleSelectTelejornal(jornal.id)}
                  >
                    <span className="truncate">{jornal.nome}</span>
                    {jornal.is_open && (
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
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7" 
                      onClick={(e) => handleEditTelejornal(jornal, e)}
                    >
                      <Edit2 className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-red-500 hover:text-red-700" 
                      onClick={(e) => handleDeleteTelejornal(jornal, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Excluir</span>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pautas Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold uppercase text-gray-500">Pautas</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={handleOpenPautaModal}
            >
              <PlusCircle className="h-4 w-4" />
              <span className="sr-only">Adicionar Pauta</span>
            </Button>
          </div>
          
          {isLoading ? (
            <p className="text-sm text-gray-500">Carregando...</p>
          ) : (
            <ul className="space-y-1">
              {pautas.map((pauta) => (
                <li key={pauta.id} className="relative group">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left pr-16"
                  >
                    {pauta.titulo}
                  </Button>
                  <div className="absolute top-1 right-1 hidden group-hover:flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7" 
                      onClick={(e) => handleEditPauta(pauta, e)}
                    >
                      <Edit2 className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-red-500 hover:text-red-700" 
                      onClick={(e) => handleDeletePauta(pauta, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Excluir</span>
                    </Button>
                  </div>
                </li>
              ))}
              {pautas.length === 0 && (
                <p className="text-sm text-gray-500 italic">Nenhuma pauta disponível</p>
              )}
            </ul>
          )}
        </div>
      </div>

      {/* Bottom Button */}
      <div className="p-4 border-t border-gray-200">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={handleOpenGeneralSchedule}
        >
          <FileText className="h-4 w-4 mr-2" />
          Espelho Geral
        </Button>
      </div>

      {/* Modals & Dialogs */}
      <GeneralScheduleModal 
        isOpen={isGeneralScheduleOpen}
        onClose={() => setIsGeneralScheduleOpen(false)}
      />

      <PautaModal
        isOpen={isPautaModalOpen}
        onClose={() => setIsPautaModalOpen(false)}
        onPautaCreated={loadData}
      />
      
      <TelejornalModal
        isOpen={isTelejornalModalOpen}
        onClose={() => setIsTelejornalModalOpen(false)}
        onTelejornalCreated={loadData}
      />
      
      {/* Edit Telejornal Dialog */}
      {editingTelejornal && (
        <EditTelejornalDialog
          isOpen={!!editingTelejornal}
          onClose={() => setEditingTelejornal(null)}
          telejornal={editingTelejornal}
          onTelejornalUpdated={loadData}
        />
      )}
      
      {/* Edit Pauta Dialog */}
      {editingPauta && (
        <EditPautaDialog
          isOpen={!!editingPauta}
          onClose={() => setEditingPauta(null)}
          pauta={editingPauta}
          onPautaUpdated={loadData}
        />
      )}
      
      {/* Delete Telejornal Confirmation */}
      <AlertDialog 
        open={!!deletingTelejornal} 
        onOpenChange={() => setDeletingTelejornal(null)}
      >
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
            <AlertDialogAction 
              onClick={confirmDeleteTelejornal}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Delete Pauta Confirmation */}
      <AlertDialog 
        open={!!deletingPauta} 
        onOpenChange={() => setDeletingPauta(null)}
      >
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
            <AlertDialogAction 
              onClick={confirmDeletePauta}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
