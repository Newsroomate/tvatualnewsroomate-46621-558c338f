import { useState, useEffect } from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { LeftSidebar } from "./LeftSidebar";
import { NewsSchedule } from "./news-schedule/NewsSchedule";
import { DualViewLayout } from "./DualViewLayout";
import { EditPanel } from "./EditPanel";
import { Materia, Telejornal } from "@/types/index";
import { updateTelejornal, fetchTelejornal } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { CloseRundownDialog } from "./CloseRundownDialog";
import { useAuth } from "@/context/AuthContext";
import { canCreateEspelhos } from "@/utils/permission";
import { PostCloseRundownModal } from "./PostCloseRundownModal";
import { SavedRundownsModal } from "./SavedRundownsModal";
import { saveRundownSnapshot } from "@/services/saved-rundowns-api";
import { fetchBlocosByTelejornal, fetchMateriasByBloco, deleteAllBlocos } from "@/services/api";

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
  const [isPostCloseModalOpen, setIsPostCloseModalOpen] = useState(false);
  const [isSavedRundownsModalOpen, setIsSavedRundownsModalOpen] = useState(false);
  const [selectedViewDate, setSelectedViewDate] = useState<Date>(new Date());
  
  // Dual view state
  const [isDualViewActive, setIsDualViewActive] = useState(false);
  const [secondaryJournal, setSecondaryJournal] = useState<string | null>(null);
  const [secondaryTelejornal, setSecondaryTelejornal] = useState<Telejornal | null>(null);

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

  const handleToggleDualView = (enabled: boolean, secondJournalId?: string) => {
    setIsDualViewActive(enabled);
    
    if (enabled && secondJournalId) {
      setSecondaryJournal(secondJournalId);
      // Fetch secondary telejornal details
      fetchTelejornal(secondJournalId).then(journal => {
        setSecondaryTelejornal(journal);
      });
    } else {
      setSecondaryJournal(null);
      setSecondaryTelejornal(null);
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

  const saveCurrentRundownSnapshot = async () => {
    if (!selectedJournal || !currentTelejornal) return;

    try {
      console.log("Salvando snapshot do espelho atual...");
      
      // Fetch current blocks and materias
      const blocks = await fetchBlocosByTelejornal(selectedJournal);
      const blocksWithItems = await Promise.all(
        blocks.map(async (block) => {
          const materias = await fetchMateriasByBloco(block.id);
          return {
            id: block.id,
            nome: block.nome,
            ordem: block.ordem,
            items: materias.map(materia => ({
              id: materia.id,
              retranca: materia.retranca,
              clip: materia.clip,
              duracao: materia.duracao || 0,
              pagina: materia.pagina,
              reporter: materia.reporter,
              status: materia.status,
              texto: materia.texto,
              cabeca: materia.cabeca,
              ordem: materia.ordem
            }))
          };
        })
      );

      // Save the snapshot
      await saveRundownSnapshot({
        telejornal_id: selectedJournal,
        data_referencia: new Date().toISOString().split('T')[0],
        nome: currentTelejornal.nome,
        estrutura: {
          blocos: blocksWithItems
        }
      });

      console.log("Snapshot salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar snapshot:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o snapshot do espelho",
        variant: "destructive"
      });
    }
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
    
    // Se o espelho está fechado e o usuário deseja abri-lo, mostrar modal de opções
    if (!currentTelejornal.espelho_aberto) {
      setIsPostCloseModalOpen(true);
      return;
    }
  };

  const handleConfirmCloseRundown = async () => {
    if (!selectedJournal || !currentTelejornal) return;
    
    try {
      // Save snapshot before closing
      await saveCurrentRundownSnapshot();
      
      // Fechar o espelho do telejornal
      await updateTelejornal(selectedJournal, {
        ...currentTelejornal,
        espelho_aberto: false
      });
      
      // Atualizar o estado local
      setCurrentTelejornal({
        ...currentTelejornal,
        espelho_aberto: false
      });
      
      toast({
        title: "Espelho fechado",
        description: `Espelho de ${currentTelejornal.nome} fechado e salvo`,
        variant: "default"
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

  const handleCreateNewRundown = async (loadLastBlock: boolean = true) => {
    if (!selectedJournal || !currentTelejornal) return;

    try {
      console.log("Criando novo espelho...");
      
      // Delete all current blocks and materias
      await deleteAllBlocos(selectedJournal);
      
      // Open the rundown
      await updateTelejornal(selectedJournal, {
        ...currentTelejornal,
        espelho_aberto: true
      });
      
      // Update local state
      setCurrentTelejornal({
        ...currentTelejornal,
        espelho_aberto: true
      });
      
      // A criação do primeiro bloco com dados do último bloco será tratada
      // automaticamente pelo componente NewsSchedule quando detectar espelho aberto sem blocos
      
      toast({
        title: "Novo espelho criado",
        description: `Novo espelho de ${currentTelejornal.nome} criado e aberto com o último bloco carregado`,
        variant: "default"
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['telejornais'] });
      queryClient.invalidateQueries({ queryKey: ['blocos', selectedJournal] });
      
    } catch (error) {
      console.error("Erro ao criar novo espelho:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar um novo espelho",
        variant: "destructive"
      });
    }
  };

  const handleViewByDate = (date: Date) => {
    setSelectedViewDate(date);
    setIsSavedRundownsModalOpen(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen overflow-hidden">
        {/* Left Sidebar */}
        <LeftSidebar 
          selectedJournal={selectedJournal}
          onSelectJournal={handleSelectJournal}
          onToggleDualView={handleToggleDualView}
        />

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col overflow-hidden ${isEditPanelOpen ? 'mr-[400px]' : ''}`}>
          {/* Rundown Status Bar */}
          {selectedJournal && (
            <div className="bg-muted px-4 py-2 border-b flex justify-between items-center">
              <div>
                {isDualViewActive ? (
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="font-medium">Visualização Dual Ativa</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Principal: {currentTelejornal?.nome} | Secundário: {secondaryTelejornal?.nome}
                    </div>
                  </div>
                ) : (
                  currentTelejornal && (
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
                  )
                )}
                {!currentTelejornal && !isDualViewActive && (
                  <div className="text-sm text-muted-foreground">
                    Nenhum espelho selecionado
                  </div>
                )}
              </div>
              
              {canCreateEspelhos(profile) && !isDualViewActive && (
                <button 
                  onClick={handleToggleRundown}
                  className={`px-4 py-1 rounded-md text-xs font-medium ${
                    currentTelejornal?.espelho_aberto 
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                >
                  {currentTelejornal?.espelho_aberto ? "Fechar Espelho" : "Abrir Espelho Agora"}
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

          {/* Content Area - Single or Dual View */}
          {isDualViewActive && selectedJournal && secondaryJournal ? (
            <DualViewLayout
              primaryJournal={selectedJournal}
              secondaryJournal={secondaryJournal}
              onEditItem={handleEditItem}
              primaryTelejornal={currentTelejornal}
              secondaryTelejornal={secondaryTelejornal}
              onOpenRundown={handleToggleRundown}
            />
          ) : (
            <NewsSchedule
              selectedJournal={selectedJournal}
              onEditItem={handleEditItem}
              currentTelejornal={currentTelejornal}
              onOpenRundown={handleToggleRundown}
            />
          )}
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
        
        {/* Modal para abrir espelho (antes era pós-fechamento) */}
        <PostCloseRundownModal
          isOpen={isPostCloseModalOpen}
          onClose={() => setIsPostCloseModalOpen(false)}
          currentTelejornal={currentTelejornal}
          onCreateNew={handleCreateNewRundown}
          onViewByDate={handleViewByDate}
        />
        
        {/* Modal para visualizar espelhos salvos por data */}
        <SavedRundownsModal
          isOpen={isSavedRundownsModalOpen}
          onClose={() => setIsSavedRundownsModalOpen(false)}
          telejornalId={selectedJournal || ""}
          targetDate={selectedViewDate}
        />
      </div>
    </QueryClientProvider>
  );
};

export default Layout;
