
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { fetchTelejornais, fetchPautas } from "@/services/api";
import { Telejornal, Pauta } from "@/types";
import { GeneralScheduleModal } from "./GeneralScheduleModal";
import { PautaModal } from "./PautaModal";

interface LeftSidebarProps {
  selectedJournal: string | null;
  onSelectJournal: (journalId: string) => void;
}

export const LeftSidebar = ({ selectedJournal, onSelectJournal }: LeftSidebarProps) => {
  const [isGeneralScheduleOpen, setIsGeneralScheduleOpen] = useState(false);
  const [isPautaModalOpen, setIsPautaModalOpen] = useState(false);
  const [telejornais, setTelejornais] = useState<Telejornal[]>([]);
  const [pautas, setPautas] = useState<Pauta[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="w-64 bg-gray-100 h-full border-r border-gray-200 flex flex-col">
      <div className="p-4 bg-primary text-primary-foreground">
        <h2 className="text-lg font-semibold">Redação TJ</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {/* Telejornais Section */}
        <div className="p-4">
          <h3 className="text-sm font-semibold uppercase text-gray-500 mb-2">Telejornais</h3>
          {isLoading ? (
            <p className="text-sm text-gray-500">Carregando...</p>
          ) : (
            <ul className="space-y-1">
              {telejornais.map((jornal) => (
                <li key={jornal.id}>
                  <Button
                    variant={selectedJournal === jornal.id ? "secondary" : "ghost"}
                    className="w-full justify-start text-left"
                    onClick={() => onSelectJournal(jornal.id)}
                  >
                    {jornal.nome}
                  </Button>
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
                <li key={pauta.id}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left"
                  >
                    {pauta.titulo}
                  </Button>
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
          Abrir Espelho Geral
        </Button>
      </div>

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
    </div>
  );
};
