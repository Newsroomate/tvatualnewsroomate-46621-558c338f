import { useState, useEffect } from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { LeftSidebar } from "./LeftSidebar";
import { NewsSchedule } from "./news-schedule/NewsSchedule";
import { EditPanel } from "./EditPanel";
import { Materia, Telejornal } from "@/types/index";
import { updateTelejornal, fetchTelejornal } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { CloseRundownDialog } from "./CloseRundownDialog";
import { useAuth } from "@/context/AuthContext";
import { canCreateEspelhos } from "@/utils/permission";
import { useRundownAutoSave } from "@/hooks/useRundownAutoSave";

// Cria um cliente de query para o React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Increase stale time to reduce unnecessary refetches
      staleTime: 1000 * 60, // 1 minute
    },
  },
});

const Layout = () => {
  const [selectedJournal, setSelectedJournal] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Materia | null>(null);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [currentTelejornal, setCurrentTelejornal] = useState<Telejornal | null>(null);
  const [isCloseRundownDialogOpen, setIsCloseRundownDialogOpen] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();
  const { autoSaveRundown } = useRundownAutoSave();

  const handleSelectJournal = (journalId: string) => {
    setSelectedJournal(journalId);
    // Fechar o painel de edição ao trocar de jornal
    setIsEditPanelOpen(false);
    
    // Fetch telejornal details - mantendo o estado do espelho
    if (journalId) {
      fetchTelejornal(journalId).then(journal => {
        setCurrentTelejornal(journal);
      });
    } else {
      setCurrentTelejornal(null);
    }
  };

  const handleEditItem = (item: Materia) => {
    if (!currentTelejornal?.espelho_aberto) {
      toast({
        title: "Espelho fechado",
        description: "Você precisa abrir o espelho para editar matérias.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedItem(item);
    setIsEditPanelOpen(true);
  };

  const handleCloseEditPanel = () => {
    setIsEditPanelOpen(false);
    setSelectedItem(null);
    
    // Explicitly invalidate queries to force a refresh of the data
    // This ensures that even if realtime updates fail, we still get fresh data
    if (selectedJournal) {
      console.log("Explicitly invalidating queries to refresh data");
      queryClient.invalidateQueries({ queryKey: ['blocos', selectedJournal] });
    }
    
    console.log("Edit panel closed - UI will update via Realtime subscription and explicit query invalidation");
  };

  const handleToggleRundown = async () => {
    if (!selectedJournal || !currentTelejornal) return;
    
    // Verificar permissões para abrir/fechar espelho
    if (!canCreateEspelhos(profile)) {
      toast({
        title: "Permissão negada",
        description: "Você não tem permissão para abrir ou fechar espelhos.",
        variant: "destructive"
      });
      return;
    }
    
    // Se o espelho está aberto e o usuário deseja fechá-lo, mostrar diálogo de confirmação
    if (currentTelejornal.espelho_aberto) {
      setIsCloseRundownDialogOpen(true);
      return;
    }
    
    // Se o espelho está fechado e o usuário deseja abri-lo, fazer a operação diretamente
    try {
      // Inverter o estado atual do espelho para este telejornal específico
      const novoEstadoEspelho = !currentTelejornal.espelho_aberto; // true neste caso
      
      // Atualizar o telejornal no banco de dados
      await updateTelejornal(selectedJournal, {
        ...currentTelejornal,
        espelho_aberto: novoEstadoEspelho
      });
      
      // Atualizar o estado local
      setCurrentTelejornal({
        ...currentTelejornal,
        espelho_aberto: novoEstadoEspelho
      });
      
      toast({
        title: "Espelho aberto",
        description: `Espelho de ${currentTelejornal.nome} aberto com sucesso`,
        variant: "default"
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['telejornais'] });
    } catch (error) {
      console.error("Erro ao atualizar status do espelho:", error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do espelho",
        variant: "destructive"
      });
    }
  };

  const handleConfirmCloseRundown = async () => {
    if (!selectedJournal || !currentTelejornal) return;
    
    try {
      // Get current blocks before closing
      const blocksQuery = queryClient.getQueryData(['blocos', selectedJournal]);
      
      // Fechar o espelho do telejornal
      await updateTelejornal(selectedJournal, {
        ...currentTelejornal,
        espelho_aberto: false
      });
      
      // Auto-save the rundown if we have blocks
      if (blocksQuery && Array.isArray(blocksQuery)) {
        await autoSaveRundown(currentTelejornal, blocksQuery as any);
      }
      
      // Atualizar o estado local
      setCurrentTelejornal({
        ...currentTelejornal,
        espelho_aberto: false
      });
      
      toast({
        title: "Espelho fechado e salvo",
        description: `Espelho de ${currentTelejornal.nome} fechado e salvo automaticamente`,
        variant: "destructive"
      });
      
      // Fechar o diálogo
      setIsCloseRundownDialogOpen(false);
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['telejornais'] });
    } catch (error) {
      console.error("Erro ao fechar espelho:", error);
      toast({
        title: "Erro",
        description: "Não foi possível fechar o espelho",
        variant: "destructive"
      });
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen overflow-hidden">
        {/* Left Sidebar */}
        <LeftSidebar 
          selectedJournal={selectedJournal}
          onSelectJournal={handleSelectJournal}
        />

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col overflow-hidden ${isEditPanelOpen ? 'mr-[400px]' : ''}`}>
          {/* Rundown Status Bar */}
          {selectedJournal && (
            <div className="bg-muted px-4 py-2 border-b flex justify-between items-center">
              <div>
                {currentTelejornal && (
                  <div className="text-sm">
                    <span className="font-medium">
                      Espelho {currentTelejornal.espelho_aberto ? (
                        <span className="text-green-600">ABERTO</span>
                      ) : (
                        <span className="text-red-600">FECHADO</span>
                      )}:
                    </span> {' '}
                    {currentTelejornal.nome} {currentTelejornal.espelho_aberto && (
                      <>- ({new Date().toLocaleDateString('pt-BR')})</>
                    )}
                  </div>
                )}
                {!currentTelejornal && (
                  <div className="text-sm text-muted-foreground">
                    Nenhum espelho selecionado
                  </div>
                )}
              </div>
              
              {canCreateEspelhos(profile) && (
                <button 
                  onClick={handleToggleRundown}
                  className={`px-4 py-1 rounded-md text-xs font-medium ${
                    currentTelejornal?.espelho_aberto 
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                >
                  {currentTelejornal?.espelho_aberto ? "Fechar Espelho" : "Abrir Espelho"}
                </button>
              )}
            </div>
          )}
          
          {!selectedJournal && (
            <div className="bg-muted px-4 py-2 border-b">
              <div className="text-sm text-muted-foreground">
                Nenhum espelho aberto no momento
              </div>
            </div>
          )}

          <NewsSchedule
            selectedJournal={selectedJournal}
            onEditItem={handleEditItem}
            currentTelejornal={currentTelejornal}
            onOpenRundown={handleToggleRundown}
          />
        </div>

        {/* Right Edit Panel (Slide in/out) */}
        <EditPanel 
          isOpen={isEditPanelOpen}
          onClose={handleCloseEditPanel}
          item={selectedItem}
        />
        
        {/* Diálogo de confirmação para fechar o espelho */}
        <CloseRundownDialog 
          isOpen={isCloseRundownDialogOpen}
          onClose={() => setIsCloseRundownDialogOpen(false)}
          onConfirm={handleConfirmCloseRundown}
          telejornalNome={currentTelejornal?.nome}
        />
      </div>
    </QueryClientProvider>
  );
};

export default Layout;
