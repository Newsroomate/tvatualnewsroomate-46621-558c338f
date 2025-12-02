
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { fetchTelejornais } from "@/services/api";
import { fetchPautas } from "@/services/pautas-api";
import { Telejornal, Pauta } from "@/types";
import { GeneralScheduleModal } from "@/components/general-schedule";
import { PautaIndependenteModal } from "@/components/PautaIndependenteModal";
import { TelejornalModal } from "@/components/TelejornalModal";
import { supabase } from "@/integrations/supabase/client";
import { TelejornalSection } from "./TelejornalSection";
import { PautaSection } from "./PautaSection";
import { MainMenu } from "./MainMenu";
import { PautasTelejornalModal } from "@/components/telejornal-content/PautasTelejornalModal";
import { ReportagensModal } from "@/components/telejornal-content/ReportagensModal";
import { EntrevistasModal } from "@/components/telejornal-content/EntrevistasModal";
import { updatePauta } from "@/services/pautas-api";

interface LeftSidebarProps {
  selectedJournal: string | null;
  onSelectJournal: (journalId: string) => void;
  onToggleDualView?: (enabled: boolean, secondJournal?: string) => void;
  isMobile?: boolean;
}

export const LeftSidebar = ({
  selectedJournal,
  onSelectJournal,
  onToggleDualView,
  isMobile = false
}: LeftSidebarProps) => {
  const [isGeneralScheduleOpen, setIsGeneralScheduleOpen] = useState(false);
  const [isPautaIndependenteModalOpen, setIsPautaIndependenteModalOpen] = useState(false);
  const [editingPauta, setEditingPauta] = useState<Pauta | null>(null);
  const [isTelejornalModalOpen, setIsTelejornalModalOpen] = useState(false);
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);
  const [telejornais, setTelejornais] = useState<Telejornal[]>([]);
  const [pautas, setPautas] = useState<Pauta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [pautasModalTelejornalId, setPautasModalTelejornalId] = useState<string | null>(null);
  const [reportagensModalTelejornalId, setReportagensModalTelejornalId] = useState<string | null>(null);
  const [entrevistasModalTelejornalId, setEntrevistasModalTelejornalId] = useState<string | null>(null);

  useEffect(() => {
    initializeData();

    // Configurando a inscrição para ouvir atualizações em tempo real da tabela telejornais
    const telejornaisChannel = supabase
      .channel('sidebar-telejornais-changes')
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'telejornais' 
        },
        (payload) => {
          console.log('Telejornal atualizado na sidebar:', payload);
          // Atualizar apenas o telejornal específico que mudou
          const updatedTelejornal = payload.new as Telejornal;
          console.log(`Sidebar - ${updatedTelejornal.nome}: espelho_aberto atualizado para ${updatedTelejornal.espelho_aberto}`);
          
          setTelejornais(prev => {
            const updated = prev.map(tj => 
              tj.id === updatedTelejornal.id ? updatedTelejornal : tj
            );
            console.log('Lista de telejornais atualizada na sidebar');
            return updated;
          });
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'telejornais' 
        },
        (payload) => {
          console.log('Telejornal inserido na sidebar:', payload);
          loadDataWithoutSelection();
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'telejornais' 
        },
        (payload) => {
          console.log('Telejornal deletado na sidebar:', payload);
          loadDataWithoutSelection();
        }
      )
      .subscribe();

    // Configurando a inscrição para ouvir atualizações em tempo real da tabela pautas
    const pautasChannel = supabase
      .channel('pautas-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pautas'
        },
        (payload) => {
          console.log('Pauta adicionada:', payload);
          loadDataWithoutSelection();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pautas'
        },
        (payload) => {
          console.log('Pauta atualizada:', payload);
          loadDataWithoutSelection();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'pautas'
        },
        (payload) => {
          console.log('Pauta excluída:', payload);
          loadDataWithoutSelection();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(telejornaisChannel);
      supabase.removeChannel(pautasChannel);
    };
  }, []);

  // Listen to local optimistic status change events to update sidebar instantly
  useEffect(() => {
    const handleStatusChange = (ev: Event) => {
      const e = ev as CustomEvent<{ id: string; espelho_aberto: boolean }>;
      if (!e.detail?.id) return;
      setTelejornais(prev => prev.map(tj => tj.id === e.detail.id ? { ...tj, espelho_aberto: e.detail.espelho_aberto } as Telejornal : tj));
    };
    window.addEventListener('telejornal:status-changed', handleStatusChange as EventListener);
    return () => {
      window.removeEventListener('telejornal:status-changed', handleStatusChange as EventListener);
    };
  }, []);

  const initializeData = async () => {
    setIsLoading(true);
    try {
      const [jornaisData, pautasData] = await Promise.all([fetchTelejornais(), fetchPautas()]);
      setTelejornais(jornaisData);
      setPautas(pautasData);

      // Apenas selecionar o primeiro jornal se não houver seleção E for a primeira inicialização
      if (!selectedJournal && !hasInitialized && jornaisData.length > 0) {
        onSelectJournal(jornaisData[0].id);
      }
      
      setHasInitialized(true);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDataWithoutSelection = async () => {
    try {
      const [jornaisData, pautasData] = await Promise.all([fetchTelejornais(), fetchPautas()]);
      setTelejornais(jornaisData);
      setPautas(pautasData);
      
      // NÃO alterar a seleção do jornal durante atualizações em tempo real
      console.log('Dados atualizados sem alterar seleção do jornal');
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  // Função pública para recarregar dados (mantendo compatibilidade)
  const loadData = async () => {
    await loadDataWithoutSelection();
  };

  const handleOpenGeneralSchedule = () => {
    setIsGeneralScheduleOpen(true);
  };

  const handleOpenPautaModal = () => {
    setEditingPauta(null);
    setIsPautaIndependenteModalOpen(true);
  };

  const handleEditPautaModal = (pauta: Pauta) => {
    setEditingPauta(pauta);
    setIsPautaIndependenteModalOpen(true);
  };

  const handleOpenTelejornalModal = () => {
    setIsTelejornalModalOpen(true);
  };

  const handleToggleMainMenu = () => {
    setIsMainMenuOpen(!isMainMenuOpen);
  };

  const handleActivateDualView = (secondJournalId: string) => {
    if (onToggleDualView) {
      onToggleDualView(true, secondJournalId);
    }
  };

  const handleDeactivateDualView = () => {
    if (onToggleDualView) {
      onToggleDualView(false);
    }
  };

  const handleOpenPautas = (telejornalId: string) => {
    setPautasModalTelejornalId(telejornalId);
  };

  const handleOpenReportagens = (telejornalId: string) => {
    setReportagensModalTelejornalId(telejornalId);
  };

  const handleOpenEntrevistas = (telejornalId: string) => {
    setEntrevistasModalTelejornalId(telejornalId);
  };

  return (
    <div className={`${isMobile ? 'w-full' : 'w-64'} bg-background h-full ${!isMobile ? 'border-r border-border/50' : ''} flex flex-col`}>
      {!isMobile && (
        <div className="p-4 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight">Newsroomate</h2>
        </div>
      )}
      
      {/* Menu Button */}
      <div className="p-3 border-b border-border/50">
        <Button variant="outline" className="w-full shadow-sm hover:shadow-md transition-all duration-200" onClick={handleToggleMainMenu}>
          <Menu className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">Menu</span>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">{/* Telejornais Section */}
        <TelejornalSection 
          telejornais={telejornais} 
          selectedJournal={selectedJournal} 
          onSelectJournal={onSelectJournal}
          onAddTelejornal={handleOpenTelejornalModal}
          isLoading={isLoading}
          onDataChange={loadData}
          onOpenPautas={handleOpenPautas}
          onOpenReportagens={handleOpenReportagens}
          onOpenEntrevistas={handleOpenEntrevistas}
        />

        {/* Pautas Section */}
        <PautaSection 
          pautas={pautas} 
          onAddPauta={handleOpenPautaModal}
          onEditPauta={handleEditPautaModal}
          isLoading={isLoading}
          onDataChange={loadData}
        />
      </div>

      {/* Modals */}
      <GeneralScheduleModal isOpen={isGeneralScheduleOpen} onClose={() => setIsGeneralScheduleOpen(false)} />
      
      <PautaIndependenteModal 
        isOpen={isPautaIndependenteModalOpen} 
        onClose={() => {
          setIsPautaIndependenteModalOpen(false);
          setEditingPauta(null);
        }}
        pauta={editingPauta}
        onPautaCreated={loadData}
      />
      
      <TelejornalModal isOpen={isTelejornalModalOpen} onClose={() => setIsTelejornalModalOpen(false)} onTelejornalCreated={loadData} />
      
      {/* Pautas do Telejornal Modal */}
      {pautasModalTelejornalId && (
        <PautasTelejornalModal
          isOpen={!!pautasModalTelejornalId}
          onClose={() => setPautasModalTelejornalId(null)}
          telejornalId={pautasModalTelejornalId}
          telejornalNome={telejornais.find(t => t.id === pautasModalTelejornalId)?.nome || ""}
        />
      )}

      {/* Reportagens Modal */}
      {reportagensModalTelejornalId && (
        <ReportagensModal
          isOpen={!!reportagensModalTelejornalId}
          onClose={() => setReportagensModalTelejornalId(null)}
          telejornalId={reportagensModalTelejornalId}
          telejornalNome={telejornais.find(t => t.id === reportagensModalTelejornalId)?.nome || ""}
        />
      )}

      {/* Entrevistas Modal */}
      {entrevistasModalTelejornalId && (
        <EntrevistasModal
          isOpen={!!entrevistasModalTelejornalId}
          onClose={() => setEntrevistasModalTelejornalId(null)}
          telejornalId={entrevistasModalTelejornalId}
          telejornalNome={telejornais.find(t => t.id === entrevistasModalTelejornalId)?.nome || ""}
        />
      )}
      
      {/* Main Menu */}
      <MainMenu
        isOpen={isMainMenuOpen}
        onClose={() => setIsMainMenuOpen(false)}
        telejornais={telejornais}
        selectedJournal={selectedJournal}
        onActivateDualView={handleActivateDualView}
        onDeactivateDualView={handleDeactivateDualView}
        onOpenGeneralSchedule={handleOpenGeneralSchedule}
      />
    </div>
  );
};
