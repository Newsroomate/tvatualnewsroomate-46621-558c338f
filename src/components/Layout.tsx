
import { useState, useEffect } from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { LeftSidebar } from "./LeftSidebar";
import { NewsSchedule } from "./NewsSchedule";
import { EditPanel } from "./EditPanel";
import { Materia, Telejornal } from "@/types";
import { updateTelejornal, fetchTelejornal } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";

// Cria um cliente de query para o React Query
const queryClient = new QueryClient();

const Layout = () => {
  const [selectedJournal, setSelectedJournal] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Materia | null>(null);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [currentTelejornal, setCurrentTelejornal] = useState<Telejornal | null>(null);
  const [isRundownOpen, setIsRundownOpen] = useState(false);
  const { toast } = useToast();

  const handleSelectJournal = (journalId: string) => {
    setSelectedJournal(journalId);
    // Fechar o painel de edição ao trocar de jornal
    setIsEditPanelOpen(false);
    
    // Fetch telejornal details to check if it's open
    if (journalId) {
      fetchTelejornal(journalId).then(journal => {
        setCurrentTelejornal(journal);
        setIsRundownOpen(!!journal?.is_open);
      });
    } else {
      setCurrentTelejornal(null);
      setIsRundownOpen(false);
    }
  };

  const handleEditItem = (item: Materia) => {
    if (!isRundownOpen) {
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
    // Atualizar a lista de matérias após edição
    queryClient.invalidateQueries({ queryKey: ['blocos', selectedJournal] });
  };

  const handleToggleRundown = async () => {
    if (!selectedJournal || !currentTelejornal) return;
    
    try {
      const updatedJournal = {
        ...currentTelejornal,
        is_open: !isRundownOpen,
        open_date: !isRundownOpen ? new Date().toISOString() : undefined
      };
      
      await updateTelejornal(selectedJournal, updatedJournal);
      setIsRundownOpen(!isRundownOpen);
      setCurrentTelejornal(updatedJournal);
      
      toast({
        title: !isRundownOpen ? "Espelho aberto" : "Espelho fechado",
        description: !isRundownOpen 
          ? `Espelho de ${currentTelejornal.nome} aberto com sucesso` 
          : `Espelho de ${currentTelejornal.nome} fechado`,
        variant: !isRundownOpen ? "default" : "destructive"
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
                      Espelho {isRundownOpen ? (
                        <span className="text-green-600">ABERTO</span>
                      ) : (
                        <span className="text-red-600">FECHADO</span>
                      )}:
                    </span> {' '}
                    {currentTelejornal.nome} {isRundownOpen && currentTelejornal.open_date && (
                      <>- ({new Date(currentTelejornal.open_date).toLocaleDateString('pt-BR')})</>
                    )}
                  </div>
                )}
                {!currentTelejornal && (
                  <div className="text-sm text-muted-foreground">
                    Nenhum espelho selecionado
                  </div>
                )}
              </div>
              
              <button 
                onClick={handleToggleRundown}
                className={`px-4 py-1 rounded-md text-xs font-medium ${
                  isRundownOpen 
                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                    : "bg-green-100 text-green-700 hover:bg-green-200"
                }`}
              >
                {isRundownOpen ? "Fechar Espelho" : "Abrir Espelho"}
              </button>
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
            isRundownOpen={isRundownOpen}
            onOpenRundown={handleToggleRundown}
          />
        </div>

        {/* Right Edit Panel (Slide in/out) */}
        <EditPanel 
          isOpen={isEditPanelOpen}
          onClose={handleCloseEditPanel}
          item={selectedItem}
        />
      </div>
    </QueryClientProvider>
  );
};

export default Layout;
