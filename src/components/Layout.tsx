
import { useState } from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { LeftSidebar } from "./LeftSidebar";
import { NewsSchedule } from "./NewsSchedule";
import { EditPanel } from "./EditPanel";
import { Materia } from "@/types";

// Cria um cliente de query para o React Query
const queryClient = new QueryClient();

const Layout = () => {
  const [selectedJournal, setSelectedJournal] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Materia | null>(null);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);

  const handleSelectJournal = (journalId: string) => {
    setSelectedJournal(journalId);
    // Fechar o painel de edição ao trocar de jornal
    setIsEditPanelOpen(false);
  };

  const handleEditItem = (item: Materia) => {
    setSelectedItem(item);
    setIsEditPanelOpen(true);
  };

  const handleCloseEditPanel = () => {
    setIsEditPanelOpen(false);
    // Atualizar a lista de matérias após edição
    queryClient.invalidateQueries({ queryKey: ['blocos', selectedJournal] });
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
          <NewsSchedule
            selectedJournal={selectedJournal}
            onEditItem={handleEditItem}
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
