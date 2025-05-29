
import { CloseRundownDialog } from "../CloseRundownDialog";
import { PostCloseRundownModal } from "../PostCloseRundownModal";
import { SavedRundownsModal } from "../SavedRundownsModal";
import { Telejornal } from "@/types/index";

interface LayoutModalsProps {
  isCloseRundownDialogOpen: boolean;
  setIsCloseRundownDialogOpen: (open: boolean) => void;
  isPostCloseModalOpen: boolean;
  setIsPostCloseModalOpen: (open: boolean) => void;
  isSavedRundownsModalOpen: boolean;
  setIsSavedRundownsModalOpen: (open: boolean) => void;
  currentTelejornal: Telejornal | null;
  selectedJournal: string | null;
  selectedViewDate: Date;
  onConfirmCloseRundown: () => void;
  onCreateNewRundown: (loadLastBlock?: boolean) => void;
  onViewByDate: (date: Date) => void;
}

export const LayoutModals = ({
  isCloseRundownDialogOpen,
  setIsCloseRundownDialogOpen,
  isPostCloseModalOpen,
  setIsPostCloseModalOpen,
  isSavedRundownsModalOpen,
  setIsSavedRundownsModalOpen,
  currentTelejornal,
  selectedJournal,
  selectedViewDate,
  onConfirmCloseRundown,
  onCreateNewRundown,
  onViewByDate
}: LayoutModalsProps) => {
  return (
    <>
      {/* Diálogo de confirmação para fechar o espelho */}
      <CloseRundownDialog 
        isOpen={isCloseRundownDialogOpen}
        onClose={() => setIsCloseRundownDialogOpen(false)}
        onConfirm={onConfirmCloseRundown}
        telejornalNome={currentTelejornal?.nome}
      />
      
      {/* Modal para abrir espelho (antes era pós-fechamento) */}
      <PostCloseRundownModal
        isOpen={isPostCloseModalOpen}
        onClose={() => setIsPostCloseModalOpen(false)}
        currentTelejornal={currentTelejornal}
        onCreateNew={onCreateNewRundown}
        onViewByDate={onViewByDate}
      />
      
      {/* Modal para visualizar espelhos salvos por data */}
      <SavedRundownsModal
        isOpen={isSavedRundownsModalOpen}
        onClose={() => setIsSavedRundownsModalOpen(false)}
        telejornalId={selectedJournal || ""}
        targetDate={selectedViewDate}
      />
    </>
  );
};
