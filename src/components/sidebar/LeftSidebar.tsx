import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { fetchTelejornais } from "@/services/api";
import { fetchPautas } from "@/services/pautas-api";
import { Telejornal, Pauta } from "@/types";
import { GeneralScheduleModal } from "@/components/general-schedule";
import { PautaModal } from "@/components/PautaModal";
import { TelejornalModal } from "@/components/TelejornalModal";
import { supabase } from "@/integrations/supabase/client";
import { TelejornalSection } from "./TelejornalSection";
import { PautaSection } from "./PautaSection";
import { DualViewMenuButton } from "./DualViewMenuButton";
import { DualJournalSelector } from "@/components/news-schedule/DualJournalSelector";

interface LeftSidebarProps {
  selectedJournal: string | null;
  onSelectJournal: (journalId: string) => void;
  isDualViewActive?: boolean;
  secondaryJournal?: string | null;
  onActivateDualView?: () => void;
  onDeactivateDualView?: () => void;
  onSelectSecondaryJournal?: (journalId: string) => void;
}

export const LeftSidebar = ({
  selectedJournal,
  onSelectJournal,
  isDualViewActive = false,
  secondaryJournal = null,
  onActivateDualView = () => {},
  onDeactivateDualView = () => {},
  onSelectSecondaryJournal = () => {}
}: LeftSidebarProps) => {
  const [isGeneralScheduleOpen, setIsGeneralScheduleOpen] = useState(false);
  const [isPautaModalOpen, setIsPautaModalOpen] = useState(false);
  const [isTelejornalModalOpen, setIsTelejornalModalOpen] = useState(false);
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

  return (
    <div className="w-64 bg-gray-100 h-full border-r border-gray-200 flex flex-col">
      <div className="p-4 bg-primary text-primary-foreground">
        <h2 className="text-lg font-semibold">Newsroomate</h2>
      </div>
      
      {/* Menu Button */}
      <DualViewMenuButton onActivateDualView={onActivateDualView} />
      
      {/* Dual View Selector - Only show when dual view is active */}
      {isDualViewActive && (
        <DualJournalSelector
          telejornais={telejornais}
          primaryJournal={selectedJournal}
          secondaryJournal={secondaryJournal}
          onSelectSecondaryJournal={onSelectSecondaryJournal}
          onDeactivateDualView={onDeactivateDualView}
        />
      )}

      {/* Bottom Button - Moved up to be more visible */}
      <div className="p-4 border-b border-gray-200">
        <Button variant="outline" className="w-full" onClick={handleOpenGeneralSchedule}>
          <FileText className="h-4 w-4 mr-2" />
          Espelho Geral
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
      </div>

      {/* Modals */}
      <GeneralScheduleModal isOpen={isGeneralScheduleOpen} onClose={() => setIsGeneralScheduleOpen(false)} />
      <PautaModal isOpen={isPautaModalOpen} onClose={() => setIsPautaModalOpen(false)} onPautaCreated={loadData} />
      <TelejornalModal isOpen={isTelejornalModalOpen} onClose={() => setIsTelejornalModalOpen(false)} onTelejornalCreated={loadData} />
    </div>
  );
};
