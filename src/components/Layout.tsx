
import { useState } from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { LeftSidebar } from "./LeftSidebar";
import { EditPanel } from "./EditPanel";
import { CloseRundownDialog } from "./CloseRundownDialog";
import { PostCloseRundownModal } from "./PostCloseRundownModal";
import { SavedRundownsModal } from "./SavedRundownsModal";
import { LayoutProvider, useLayoutContext } from "@/context/LayoutContext";
import { RundownStatusBar } from "./layout/RundownStatusBar";
import { LayoutContent } from "./layout/LayoutContent";
import { useRundownOperations } from "@/hooks/useRundownOperations";
import { useJournalSelection } from "@/hooks/useJournalSelection";
import { useEditPanel } from "@/hooks/useEditPanel";

// Cria um cliente de query para o React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Increase stale time to reduce unnecessary refetches
      staleTime: 1000 * 60, // 1 minute
    },
  },
});

const LayoutInner = () => {
  const {
    selectedJournal,
    setSelectedJournal,
    currentTelejornal,
    setCurrentTelejornal,
    selectedViewDate,
    setSelectedViewDate,
    isDualViewActive,
    setIsDualViewActive,
    secondaryJournal,
    setSecondaryJournal,
    secondaryTelejornal,
    setSecondaryTelejornal,
  } = useLayoutContext();

  const [isSavedRundownsModalOpen, setIsSavedRundownsModalOpen] = useState(false);

  const { isEditPanelOpen, setIsEditPanelOpen, selectedItem, handleEditItem, handleCloseEditPanel } = useEditPanel({
    currentTelejornal,
    selectedJournal,
    queryClient
  });

  const { handleSelectJournal, handleToggleDualView } = useJournalSelection({
    setSelectedJournal,
    setCurrentTelejornal,
    setSecondaryJournal,
    setSecondaryTelejornal,
    setIsDualViewActive,
    setIsEditPanelOpen
  });

  const {
    isCloseRundownDialogOpen,
    setIsCloseRundownDialogOpen,
    isPostCloseModalOpen,
    setIsPostCloseModalOpen,
    handleToggleRundown,
    handleConfirmCloseRundown,
    handleCreateNewRundown,
    handleCreateFromModel,
  } = useRundownOperations({
    selectedJournal,
    currentTelejornal,
    setCurrentTelejornal,
    queryClient
  });

  const handleViewByDate = (date: Date) => {
    setSelectedViewDate(date);
    setIsSavedRundownsModalOpen(true);
  };

  return (
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
        <RundownStatusBar
          selectedJournal={selectedJournal}
          currentTelejornal={currentTelejornal}
          secondaryTelejornal={secondaryTelejornal}
          isDualViewActive={isDualViewActive}
          onToggleRundown={handleToggleRundown}
        />

        {/* Content Area - Single or Dual View */}
        <LayoutContent
          isDualViewActive={isDualViewActive}
          selectedJournal={selectedJournal}
          secondaryJournal={secondaryJournal}
          currentTelejornal={currentTelejornal}
          secondaryTelejornal={secondaryTelejornal}
          onEditItem={handleEditItem}
          onOpenRundown={handleToggleRundown}
        />
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
        onCreateFromModel={handleCreateFromModel}
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
  );
};

const Layout = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LayoutProvider>
        <LayoutInner />
      </LayoutProvider>
    </QueryClientProvider>
  );
};

export default Layout;
