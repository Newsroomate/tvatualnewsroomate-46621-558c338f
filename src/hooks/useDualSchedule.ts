
import { useState, useEffect } from "react";
import { Telejornal, Materia } from "@/types";
import { fetchTelejornal } from "@/services/api";

interface UseDualScheduleProps {
  primaryJournalId: string | null;
  secondaryJournalId: string | null;
}

export const useDualSchedule = ({ 
  primaryJournalId, 
  secondaryJournalId 
}: UseDualScheduleProps) => {
  const [primaryTelejornal, setPrimaryTelejornal] = useState<Telejornal | null>(null);
  const [secondaryTelejornal, setSecondaryTelejornal] = useState<Telejornal | null>(null);
  const [isDualMode, setIsDualMode] = useState(false);

  // Fetch primary journal data
  useEffect(() => {
    if (primaryJournalId) {
      fetchTelejornal(primaryJournalId).then(journal => {
        setPrimaryTelejornal(journal);
      });
    } else {
      setPrimaryTelejornal(null);
    }
  }, [primaryJournalId]);

  // Fetch secondary journal data
  useEffect(() => {
    if (secondaryJournalId) {
      fetchTelejornal(secondaryJournalId).then(journal => {
        setSecondaryTelejornal(journal);
      });
    } else {
      setSecondaryTelejornal(null);
    }
  }, [secondaryJournalId]);

  // Enable dual mode when both journals are selected
  useEffect(() => {
    setIsDualMode(!!primaryJournalId && !!secondaryJournalId && primaryJournalId !== secondaryJournalId);
  }, [primaryJournalId, secondaryJournalId]);

  const handleTransferMateria = async (materia: Materia, targetJournalId: string) => {
    // This will be handled by the drag and drop implementation
    console.log('Transferring materia to journal:', targetJournalId);
  };

  return {
    primaryTelejornal,
    secondaryTelejornal,
    isDualMode,
    handleTransferMateria
  };
};
