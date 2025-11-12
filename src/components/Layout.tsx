import { useState, useEffect } from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { LeftSidebar } from "./sidebar/LeftSidebar";
import { NewsSchedule } from "./news-schedule/NewsSchedule";
import { DualViewLayout } from "./DualViewLayout";
import { EditPanel } from "./EditPanel";
import { AppHeader } from "./AppHeader";
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
import { useRealtimeTelejornais } from "@/hooks/useRealtimeTelejornais";
import { useRealtimeInvalidation } from "@/hooks/useRealtimeInvalidation";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileDrawer } from "./MobileDrawer";
import { MobileEditPanel } from "./MobileEditPanel";

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
  
  // Mobile state
  const isMobile = useIsMobile();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  
  // Dual view state
  const [isDualViewActive, setIsDualViewActive] = useState(false);
  const [secondaryJournal, setSecondaryJournal] = useState<string | null>(null);
  const [secondaryTelejornal, setSecondaryTelejornal] = useState<Telejornal | null>(null);

  // Setup realtime subscription for telejornais
  useRealtimeTelejornais({
    onTelejornalUpdate: (updatedTelejornal: Telejornal) => {
      console.log('Telejornal atualizado via realtime no Layout:', updatedTelejornal);
      
      // Atualizar o telejornal principal se necessário
      if (currentTelejornal && updatedTelejornal.id === currentTelejornal.id) {
        console.log('Atualizando telejornal principal:', updatedTelejornal);
        setCurrentTelejornal(updatedTelejornal);
      }
      
      // Atualizar o telejornal secundário se necessário  
      if (secondaryTelejornal && updatedTelejornal.id === secondaryTelejornal.id) {
        console.log('Atualizando telejornal secundário:', updatedTelejornal);
        setSecondaryTelejornal(updatedTelejornal);
      }
    }
  });

  // Setup global realtime invalidation
  useRealtimeInvalidation();

  const handleSelectJournal = (journalId: string) => {
    setSelectedJournal(journalId);
    // Fechar o painel de edição ao trocar de jornal
    setIsEditPanelOpen(false);
    
    // Fetch telejornal details - mantendo o estado do espelho
    if (journalId) {
      fetchTelejornal(journalId).then(journal => {
        console.log('Telejornal carregado no Layout:', journal);
        setCurrentTelejornal(journal);
      }).catch(error => {
        console.error('Erro ao carregar telejornal:', error);
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
      console.log("Salvando snapshot do espelho atual para fechamento manual...");
      
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
              tempo_clip: materia.tempo_clip,
              duracao: materia.duracao || 0,
              pagina: materia.pagina,
              reporter: materia.reporter,
              status: materia.status,
              texto: materia.texto,
              cabeca: materia.cabeca,
              gc: materia.gc,
              tipo_material: materia.tipo_material,
              local_gravacao: materia.local_gravacao,
              tags: materia.tags,
              horario_exibicao: materia.horario_exibicao,
              ordem: materia.ordem
            }))
          };
        })
      );

      // Para fechamento manual, usar a data atual do dispositivo
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dataReferencia = `${year}-${month}-${day}`;

      console.log("Fechamento manual - usando data atual:", dataReferencia);

      // Save the snapshot
      await saveRundownSnapshot({
        telejornal_id: selectedJournal,
        data_referencia: dataReferencia,
        nome: currentTelejornal.nome,
        estrutura: {
          blocos: blocksWithItems
        }
      });

      console.log("Snapshot salvo com sucesso para fechamento manual!");
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
    
    // Optimistic update - immediately show closed status
    const optimisticTelejornal = {
      ...currentTelejornal,
      espelho_aberto: false
    };
    setCurrentTelejornal(optimisticTelejornal);
    setIsCloseRundownDialogOpen(false);
    // Broadcast local event so sidebar updates instantly
    window.dispatchEvent(new CustomEvent('telejornal:status-changed', { detail: { id: selectedJournal, espelho_aberto: false } }));
    
    try {
      // Save snapshot and update telejornal in parallel for speed
      const [, result] = await Promise.all([
        saveCurrentRundownSnapshot(),
        updateTelejornal(selectedJournal, {
          ...currentTelejornal,
          espelho_aberto: false
        })
      ]);
      
      if (result) {
        console.log('Telejornal fechado com sucesso:', result);
        toast({
          title: "Espelho fechado",
          description: `Espelho de ${result.nome} fechado e salvo`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Erro ao fechar espelho:", error);
      // Revert optimistic update on error
      setCurrentTelejornal(currentTelejornal);
      toast({
        title: "Erro",
        description: "Não foi possível fechar o espelho",
        variant: "destructive"
      });
    }
  };

  const handleCreateNewRundown = async () => {
    if (!selectedJournal || !currentTelejornal) return;

    // Optimistic update - immediately show opened status
    const optimisticTelejornal = {
      ...currentTelejornal,
      espelho_aberto: true
    };
    setCurrentTelejornal(optimisticTelejornal);
    setIsPostCloseModalOpen(false);
    // Broadcast local event so sidebar updates instantly
    window.dispatchEvent(new CustomEvent('telejornal:status-changed', { detail: { id: selectedJournal, espelho_aberto: true } }));

    try {
      console.log("Criando novo espelho...");
      
      // Delete blocks and open telejornal in parallel for speed
      const [, result] = await Promise.all([
        deleteAllBlocos(selectedJournal),
        updateTelejornal(selectedJournal, {
          ...currentTelejornal,
          espelho_aberto: true
        })
      ]);
      
      if (result) {
        console.log('Telejornal aberto com sucesso:', result);
      }
      
      // O primeiro bloco será criado automaticamente pelo componente NewsSchedule
      // quando detectar espelho aberto sem blocos (bloco vazio sem dados anteriores)
      
      toast({
        title: "Novo espelho criado",
        description: `Novo espelho de ${currentTelejornal.nome} criado e aberto`,
        variant: "default"
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['telejornais'] });
      queryClient.invalidateQueries({ queryKey: ['blocos', selectedJournal] });
      
    } catch (error) {
      console.error("Erro ao criar novo espelho:", error);
      // Revert optimistic update on error
      setCurrentTelejornal(currentTelejornal);
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

  const handleMobileMenuToggle = () => {
    setIsMobileDrawerOpen(!isMobileDrawerOpen);
  };

  const handleMobileDrawerClose = () => {
    setIsMobileDrawerOpen(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col h-screen overflow-hidden">
        {/* App Header */}
        <AppHeader 
          showMenuButton={isMobile}
          onMenuToggle={handleMobileMenuToggle}
        />
        
        <div className="flex flex-1 overflow-hidden">
        {/* Desktop Left Sidebar */}
        {!isMobile && (
          <LeftSidebar 
            selectedJournal={selectedJournal}
            onSelectJournal={handleSelectJournal}
            onToggleDualView={handleToggleDualView}
          />
        )}

        {/* Mobile Drawer */}
        {isMobile && (
          <MobileDrawer
            isOpen={isMobileDrawerOpen}
            onClose={handleMobileDrawerClose}
            title="Newsroomate"
          >
            <LeftSidebar 
              selectedJournal={selectedJournal}
              onSelectJournal={(journalId) => {
                handleSelectJournal(journalId);
                setIsMobileDrawerOpen(false);
              }}
              onToggleDualView={handleToggleDualView}
              isMobile={true}
            />
          </MobileDrawer>
        )}

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col overflow-hidden ${
          !isMobile && isEditPanelOpen ? 'mr-[400px]' : ''
        }`}>
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
              
              {canCreateEspelhos(profile) && !isDualViewActive && !isMobile && (
                <button 
                  onClick={handleToggleRundown}
                  className={`px-3 py-1 rounded-md text-xs font-medium ${
                    currentTelejornal?.espelho_aberto 
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                >
                  {currentTelejornal?.espelho_aberto 
                    ? "Fechar Espelho" 
                    : "Abrir Espelho Agora"
                  }
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

        {/* Desktop Edit Panel (Slide in/out) */}
        {!isMobile && (
          <EditPanel 
            isOpen={isEditPanelOpen}
            onClose={handleCloseEditPanel}
            item={selectedItem}
          />
        )}

        {/* Mobile Edit Panel */}
        {isMobile && (
          <MobileEditPanel
            isOpen={isEditPanelOpen}
            onClose={handleCloseEditPanel}
            item={selectedItem}
            title="Editar Matéria"
          />
        )}
        
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
      </div>
    </QueryClientProvider>
  );
};

export default Layout;
