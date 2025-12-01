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
import { PostCloseRundownModal } from "./PostCloseRundownModal";
import { usePermissionCheck } from "@/hooks/usePermissionCheck";
import { SavedRundownsModal } from "./SavedRundownsModal";
import { saveRundownSnapshot } from "@/services/saved-rundowns-api";
import { supabase } from "@/integrations/supabase/client";
import { fetchBlocosByTelejornal, fetchMateriasByBloco, deleteAllBlocos } from "@/services/api";
import { usePermissionGuard } from "@/hooks/usePermissionGuard";
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
  const { profile, userPermissions } = useAuth();
  const { guardAction } = usePermissionGuard();
  const permissionCheck = usePermissionCheck();
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
      console.log("=== INICIANDO SALVAMENTO DE SNAPSHOT ===");
      console.log("Telejornal ID:", selectedJournal);
      console.log("Telejornal nome:", currentTelejornal.nome);
      
      // Fetch current blocks and materias
      const blocks = await fetchBlocosByTelejornal(selectedJournal);
      console.log("Blocos encontrados:", blocks.length);
      
      const blocksWithItems = await Promise.all(
        blocks.map(async (block) => {
          const materias = await fetchMateriasByBloco(block.id);
          console.log(`Bloco "${block.nome}" (ordem ${block.ordem}): ${materias.length} matérias`);
          
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
              editor: materia.editor,
              equipamento: materia.equipamento,
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

      const totalMaterias = blocksWithItems.reduce((sum, block) => sum + block.items.length, 0);
      console.log("Total de matérias no snapshot:", totalMaterias);
      console.log("Estrutura completa:", JSON.stringify({ blocos: blocksWithItems }, null, 2));

      // Para fechamento manual, usar a data atual do dispositivo
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dataReferencia = `${year}-${month}-${day}`;

      console.log("Fechamento manual - usando data atual:", dataReferencia);

      // Get current user
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) {
        throw new Error("Usuário não autenticado");
      }

      // Save the snapshot with permission check
      await guardAction('create', 'espelho', async () => {
        await saveRundownSnapshot({
          telejornal_id: selectedJournal,
          data_referencia: dataReferencia,
          nome: currentTelejornal.nome,
          estrutura: {
            telejornal: {
              id: selectedJournal,
              nome: currentTelejornal.nome,
              horario: currentTelejornal.horario || ''
            },
            telejornal_id: selectedJournal,
            nome_telejornal: currentTelejornal.nome,
            horario: currentTelejornal.horario || '',
            blocos: blocksWithItems
          }
        });
        console.log("Snapshot salvo com sucesso para fechamento manual!");
      });
    } catch (error: any) {
      console.error("❌ ERRO AO SALVAR SNAPSHOT:", error);
      
      // Mensagem detalhada de erro
      const errorMessage = error?.message || "Não foi possível salvar o snapshot do espelho";
      const errorCode = error?.code ? ` (Código: ${error.code})` : "";
      
      toast({
        title: "Erro ao salvar snapshot",
        description: `${errorMessage}${errorCode}`,
        variant: "destructive"
      });
      
      // Re-throw para que handleConfirmCloseRundown possa capturar
      throw error;
    }
  };

  const handleToggleRundown = async () => {
    if (!selectedJournal || !currentTelejornal) return;
    
    // Verificar permissões granulares para abrir/fechar espelho
    const canOpen = userPermissions.includes('abrir_espelho');
    const canClose = userPermissions.includes('fechar_espelho');
    
    // Se está tentando abrir e não tem permissão
    if (!currentTelejornal.espelho_aberto && !canOpen) {
      toast({
        title: "Permissão negada",
        description: "Você não tem permissão para abrir espelhos. Entre em contato com o editor-chefe.",
        variant: "destructive"
      });
      return;
    }
    
    // Se está tentando fechar e não tem permissão
    if (currentTelejornal.espelho_aberto && !canClose) {
      toast({
        title: "Permissão negada",
        description: "Você não tem permissão para fechar espelhos. Entre em contato com o editor-chefe.",
        variant: "destructive"
      });
      return;
    }
    
    // Se o espelho está aberto e o usuário deseja fechá-lo, validar se há matérias
    if (currentTelejornal.espelho_aberto) {
      try {
        const blocks = await fetchBlocosByTelejornal(selectedJournal);
        let hasItems = false;
        
        for (const block of blocks) {
          const materias = await fetchMateriasByBloco(block.id);
          if (materias.length > 0) {
            hasItems = true;
            break;
          }
        }
        
        if (!hasItems) {
          console.warn("Tentativa de fechar espelho vazio");
          toast({
            title: "Espelho vazio",
            description: "Este espelho não possui nenhuma matéria. Adicione matérias antes de fechar.",
            variant: "destructive"
          });
          return;
        }
      } catch (error) {
        console.error("Erro ao verificar matérias:", error);
      }
      
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
    
    // ✅ VALIDAÇÃO PREVENTIVA: Verificar autenticação ANTES de fechar
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      toast({
        title: "Erro de autenticação",
        description: "Usuário não autenticado. Faça login novamente.",
        variant: "destructive"
      });
      return;
    }
    
    setIsCloseRundownDialogOpen(false);
    
    try {
      console.log("=== INICIANDO PROCESSO DE FECHAMENTO ===");
      console.log("Usuário autenticado:", currentUser.user.id);
      
      // PASSO 1: Salvar snapshot ANTES de atualizar o status
      console.log("Passo 1: Salvando snapshot com espelho ainda aberto...");
      await saveCurrentRundownSnapshot();
      console.log("Snapshot salvo com sucesso!");
      
      // PASSO 2: Atualizar status do telejornal para fechado
      console.log("Passo 2: Atualizando status do telejornal para fechado...");
      const result = await updateTelejornal(selectedJournal, {
        ...currentTelejornal,
        espelho_aberto: false
      });
      
      if (result) {
        console.log('Telejornal fechado com sucesso:', result);
        
        // PASSO 3: Atualizar UI
        setCurrentTelejornal({
          ...currentTelejornal,
          espelho_aberto: false
        });
        
        // Broadcast local event so sidebar updates instantly
        window.dispatchEvent(new CustomEvent('telejornal:status-changed', { 
          detail: { id: selectedJournal, espelho_aberto: false } 
        }));
        
        toast({
          title: "Espelho fechado",
          description: `Espelho de ${result.nome} fechado e salvo com sucesso`,
          variant: "default"
        });
      }
    } catch (error: any) {
      console.error("=== ERRO AO FECHAR ESPELHO ===", error);
      
      // Mensagem detalhada de erro
      const errorMessage = error?.message || "Não foi possível fechar o espelho";
      const errorDetails = error?.code ? ` (Código: ${error.code})` : "";
      
      toast({
        title: "Erro ao fechar espelho",
        description: `${errorMessage}${errorDetails}`,
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
                      {currentTelejornal.nome} {currentTelejornal.espelho_aberto && currentTelejornal.created_at && (
                        <>- ({new Date(currentTelejornal.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })})</>
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
              
              {(userPermissions.includes('abrir_espelho') || userPermissions.includes('fechar_espelho')) && !isDualViewActive && !isMobile && (
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
