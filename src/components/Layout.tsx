
import { LeftSidebar } from "./LeftSidebar";
import { NewsSchedule } from "./news-schedule/NewsSchedule";
import { EditPanel } from "./EditPanel";
import { QueryProvider } from "./layout/QueryClientProvider";
import { RundownStatusBar } from "./layout/RundownStatusBar";
import { LayoutModals } from "./layout/LayoutModals";
import { useLayoutState } from "./layout/useLayoutState";
import { useLayoutHandlers } from "./layout/useLayoutHandlers";

const Layout = () => {
  const {
    selectedJournal,
    setSelectedJournal,
    selectedItem,
    setSelectedItem,
    isEditPanelOpen,
    setIsEditPanelOpen,
    currentTelejornal,
    setCurrentTelejornal,
    isCloseRundownDialogOpen,
    setIsCloseRundownDialogOpen,
    isPostCloseModalOpen,
    setIsPostCloseModalOpen,
    isSavedRundownsModalOpen,
    setIsSavedRundownsModalOpen,
    selectedViewDate,
    setSelectedViewDate
  } = useLayoutState();

  const {
    handleSelectJournal,
    handleEditItem,
    handleCloseEditPanel,
    handleToggleRundown,
    handleConfirmCloseRundown,
    handleCreateNewRundown,
    handleViewByDate
  } = useLayoutHandlers({
    selectedJournal,
    setSelectedJournal,
    setSelectedItem,
    setIsEditPanelOpen,
    currentTelejornal,
    setCurrentTelejornal,
    setIsCloseRundownDialogOpen,
    setIsPostCloseModalOpen,
    setIsSavedRundownsModalOpen,
    setSelectedViewDate
  });

  return (
    <QueryProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Left Sidebar */}
        <LeftSidebar 
          selectedJournal={selectedJournal}
          onSelectJournal={handleSelectJournal}
        />

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col overflow-hidden ${isEditPanelOpen ? 'mr-[400px]' : ''}`}>
          {/* Rundown Status Bar */}
          <RundownStatusBar
            selectedJournal={selectedJournal}
            currentTelejornal={currentTelejornal}
            onToggleRundown={handleToggleRundown}
          />

          <NewsSchedule
            selectedJournal={selectedJournal}
            onEditItem={handleEditItem}
            currentTelejornal={currentTelejornal}
            onOpenRundown={handleToggleRundown}
          />
        </div>

        {/* Right Edit Panel (Slide in/out) */}
        <EditPanel 
          isOpen={isEditPanelOpen}
          onClose={handleCloseEditPanel}
          item={selectedItem}
        />
        
        {/* All Modals */}
        <LayoutModals
          isCloseRundownDialogOpen={isCloseRundownDialogOpen}
          setIsCloseRundownDialogOpen={setIsCloseRundownDialogOpen}
          isPostCloseModalOpen={isPostCloseModalOpen}
          setIsPostCloseModalOpen={setIsPostCloseModalOpen}
          isSavedRundownsModalOpen={isSavedRundownsModalOpen}
          setIsSavedRundownsModalOpen={setIsSavedRundownsModalOpen}
          currentTelejornal={currentTelejornal}
          selectedJournal={selectedJournal}
          selectedViewDate={selectedViewDate}
          onConfirmCloseRundown={handleConfirmCloseRundown}
          onCreateNewRundown={handleCreateNewRundown}
          onViewByDate={handleViewByDate}
        />
      </div>
    </QueryProvider>
  );
};

export default Layout;
