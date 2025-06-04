
import { fetchTelejornal } from "@/services/api";
import { Telejornal } from "@/types";

interface UseJournalSelectionProps {
  setSelectedJournal: (journalId: string | null) => void;
  setCurrentTelejornal: (telejornal: Telejornal | null) => void;
  setSecondaryJournal: (journalId: string | null) => void;
  setSecondaryTelejornal: (telejornal: Telejornal | null) => void;
  setIsDualViewActive: (active: boolean) => void;
  setIsEditPanelOpen: (open: boolean) => void;
}

export const useJournalSelection = ({
  setSelectedJournal,
  setCurrentTelejornal,
  setSecondaryJournal,
  setSecondaryTelejornal,
  setIsDualViewActive,
  setIsEditPanelOpen
}: UseJournalSelectionProps) => {
  const handleSelectJournal = (journalId: string) => {
    setSelectedJournal(journalId);
    // Fechar o painel de edição ao trocar de jornal
    setIsEditPanelOpen(false);
    
    // Fetch telejornal details - mantendo o estado do espelho
    if (journalId) {
      fetchTelejornal(journalId).then(journal => {
        setCurrentTelejornal(journal);
      });
    } else {
      setCurrentTelejornal(null);
    }
  };

  const handleToggleDualView = (enabled: boolean, secondJournalId?: string) => {
    setIsDualViewActive(enabled);
    
    if (enabled && secondJournalId) {
      setSecondaryJournal(secondJournalId);
      // Fetch secondary telejornal details
      fetchTelejornal(secondJournalId).then(journal => {
        setSecondaryTelejornal(journal);
      });
    } else {
      setSecondaryJournal(null);
      setSecondaryTelejornal(null);
    }
  };

  return {
    handleSelectJournal,
    handleToggleDualView,
  };
};
