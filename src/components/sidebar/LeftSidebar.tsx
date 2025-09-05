import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { fetchTelejornais } from "@/services/api";
import { fetchPautas } from "@/services/pautas-api";
import { Telejornal, Pauta } from "@/types";
import { GeneralScheduleModal } from "@/components/general-schedule";
import { PautaModal } from "@/components/PautaModal";
import { TelejornalModal } from "@/components/TelejornalModal";
import { supabase } from "@/integrations/supabase/client";
import { TelejornalSection } from "./TelejornalSection";
import { PautaSection } from "./PautaSection";
import { HistoricoEspelhosSection } from "./HistoricoEspelhosSection";
import { MainMenu } from "./MainMenu";

interface LeftSidebarProps {
  selectedJournal: string | null;
  onSelectJournal: (journalId: string) => void;
  onToggleDualView?: (enabled: boolean, secondJournalId?: string) => void;
  isMobile?: boolean;
  isSidebarOpen?: boolean;
  onCloseSidebar?: () => void;
}

export const LeftSidebar = ({ 
  selectedJournal, 
  onSelectJournal,
  onToggleDualView,
  isMobile = false,
  isSidebarOpen = true,
  onCloseSidebar
}: LeftSidebarProps) => {
  const [isGeneralScheduleOpen, setIsGeneralScheduleOpen] = useState(false);
  const [isPautaModalOpen, setIsPautaModalOpen] = useState(false);
  const [isTelejornalModalOpen, setIsTelejornalModalOpen] = useState(false);
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);

  // Data states
  const [telejornais, setTelejornais] = useState<Telejornal[]>([]);
  const [pautas, setPautas] = useState<Pauta[]>([]);

  // Initialize data when component mounts
  useEffect(() => {
    initializeData();
  }, []);

  // Realtime subscriptions
  useEffect(() => {
    const telejornaisSubscription = supabase
      .channel('telejornais_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'telejornais' 
      }, (payload) => {
        console.log('Realtime change in telejornais:', payload);
        loadDataWithoutSelection();
      })
      .subscribe();

    const pautasSubscription = supabase
      .channel('pautas_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'pautas' 
      }, (payload) => {
        console.log('Realtime change in pautas:', payload);
        loadDataWithoutSelection();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(telejornaisSubscription);
      supabase.removeChannel(pautasSubscription);
    };
  }, []);

  const initializeData = async () => {
    try {
      const [telejornaisData, pautasData] = await Promise.all([
        fetchTelejornais(),
        fetchPautas()
      ]);
      
      setTelejornais(telejornaisData);
      setPautas(pautasData);
      
      console.log('LeftSidebar: Dados carregados - Telejornais:', telejornaisData.length, 'Pautas:', pautasData.length);
    } catch (error) {
      console.error('Erro ao carregar dados do sidebar:', error);
    }
  };

  const loadDataWithoutSelection = async () => {
    try {
      const [telejornaisData, pautasData] = await Promise.all([
        fetchTelejornais(),
        fetchPautas()
      ]);
      
      setTelejornais(telejornaisData);
      setPautas(pautasData);
    } catch (error) {
      console.error('Erro ao recarregar dados do sidebar:', error);
    }
  };

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

  const handleActivateDualView = (secondaryJournalId: string) => {
    if (onToggleDualView) {
      onToggleDualView(true, secondaryJournalId);
    }
  };

  const handleDeactivateDualView = () => {
    if (onToggleDualView) {
      onToggleDualView(false);
    }
  };

  // Mobile sidebar content
  const sidebarContent = (
    <div className="bg-muted border-r flex flex-col h-full">
      {/* Header with toggle button */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Newsroom</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleMainMenu}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <TelejornalSection 
          telejornais={telejornais}
          selectedJournal={selectedJournal}
          onSelectJournal={onSelectJournal}
          onAddTelejornal={handleOpenTelejornalModal}
          isLoading={false}
          onDataChange={loadData}
        />
        
        <PautaSection 
          pautas={pautas}
          onAddPauta={handleOpenPautaModal}
          isLoading={false}
          onDataChange={loadData}
        />
      </div>
    </div>
  );

  return (
    <>
      {isMobile ? (
        // Mobile: Sliding sidebar
        <div className={`fixed top-16 left-0 bottom-0 w-80 z-50 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {sidebarContent}
        </div>
      ) : (
        // Desktop: Always visible sidebar
        <div className="w-80">
          {sidebarContent}
        </div>
      )}

      {/* Modals */}
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
    </>
  );
};