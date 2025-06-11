import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { fetchTelejornais } from "@/services/api";
import { fetchPautas } from "@/services/pautas-api";
import { Telejornal, Pauta } from "@/types";
import { ClosedRundownSnapshot } from "@/services/snapshots-api";
import { GeneralScheduleModal } from "@/components/general-schedule";
import { PautaModal } from "@/components/PautaModal";
import { TelejornalModal } from "@/components/TelejornalModal";
import { HistoricoEspelhosModal } from "@/components/historico-espelhos";
import { supabase } from "@/integrations/supabase/client";
import { TelejornalSection } from "./TelejornalSection";
import { PautaSection } from "./PautaSection";
import { HistoricoEspelhosSection } from "./HistoricoEspelhosSection";
import { MainMenu } from "./MainMenu";

interface LeftSidebarProps {
  selectedJournal: string | null;
  onSelectJournal: (journalId: string) => void;
  onToggleDualView?: (enabled: boolean, secondJournal?: string) => void;
}

export const LeftSidebar = ({
  selectedJournal,
  onSelectJournal,
  onToggleDualView
}: LeftSidebarProps) => {
  const [isGeneralScheduleOpen, setIsGeneralScheduleOpen] = useState(false);
  const [isPautaModalOpen, setIsPautaModalOpen] = useState(false);
  const [isTelejornalModalOpen, setIsTelejornalModalOpen] = useState(false);
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);
  const [isHistoricoModalOpen, setIsHistoricoModalOpen] = useState(false);
  const [selectedHistoricoSnapshot, setSelectedHistoricoSnapshot] = useState<ClosedRundownSnapshot | null>(null);
  const [telejornais, setTelejornais] = useState<Telejornal[]>([]);
  const [pautas, setPautas] = useState<Pauta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    initializeData();

    // Configurando a inscrição para ouvir atualizações em tempo real da tabela telejornais
    const telejornaisChannel = supabase
      .channel('telejornais-changes')
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'telejornais' 
        },
        (payload) => {
          console.log('Telejornal atualizado:', payload);
          // Recarregar apenas os dados, sem alterar seleção
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
    setIsPautaModalOpen(true);
  };

  const handleOpenTelejornalModal = () => {
    setIsTelejornalModalOpen(true);
  };

  const handleToggleMainMenu = () => {
    setIsMainMenuOpen(!isMainMenuOpen);
  };

  const handleOpenHistorico = (snapshot: ClosedRundownSnapshot) => {
    setSelectedHistoricoSnapshot(snapshot);
    setIsHistoricoModalOpen(true);
  };

  const handleCloseHistorico = () => {
    setIsHistoricoModalOpen(false);
    setSelectedHistoricoSnapshot(null);
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

  return (
    <div className="w-64 bg-gray-100 h-full border-r border-gray-200 flex flex-col">
      <div className="p-4 bg-primary text-primary-foreground">
        <h2 className="text-lg font-semibold">Newsroomate</h2>
      </div>
      
      {/* Menu Button */}
      <div className="p-4 border-b border-gray-200">
        <Button variant="outline" className="w-full" onClick={handleToggleMainMenu}>
          <Menu className="h-4 w-4 mr-2" />
          Menu
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Telejornais Section */}
        <TelejornalSection 
          telejornais={telejornais} 
          selectedJournal={selectedJournal} 
          onSelectJournal={onSelectJournal}
          onAddTelejornal={handleOpenTelejornalModal}
          isLoading={isLoading}
          onDataChange={loadData}
        />

        {/* Pautas Section */}
        <PautaSection 
          pautas={pautas} 
          onAddPauta={handleOpenPautaModal}
          isLoading={isLoading}
          onDataChange={loadData}
        />

        {/* Histórico de Espelhos Section */}
        <HistoricoEspelhosSection
          telejornais={telejornais}
          onOpenHistorico={handleOpenHistorico}
          isLoading={isLoading}
        />
      </div>

      {/* Modals */}
      <GeneralScheduleModal isOpen={isGeneralScheduleOpen} onClose={() => setIsGeneralScheduleOpen(false)} />
      <PautaModal isOpen={isPautaModalOpen} onClose={() => setIsPautaModalOpen(false)} onPautaCreated={loadData} />
      <TelejornalModal isOpen={isTelejornalModalOpen} onClose={() => setIsTelejornalModalOpen(false)} onTelejornalCreated={loadData} />
      
      {/* Histórico Modal */}
      <HistoricoEspelhosModal
        isOpen={isHistoricoModalOpen}
        onClose={handleCloseHistorico}
        snapshot={selectedHistoricoSnapshot}
      />
      
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
