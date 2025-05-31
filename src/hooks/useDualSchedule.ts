
import { useState } from "react";
import { Telejornal, Materia } from "@/types";
import { updateMateria } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export const useDualSchedule = () => {
  const [isDualViewActive, setIsDualViewActive] = useState(false);
  const [secondaryJournal, setSecondaryJournal] = useState<string | null>(null);
  const { toast } = useToast();

  const activateDualView = () => {
    setIsDualViewActive(true);
  };

  const deactivateDualView = () => {
    setIsDualViewActive(false);
    setSecondaryJournal(null);
  };

  const selectSecondaryJournal = (journalId: string) => {
    setSecondaryJournal(journalId);
  };

  const moveMateriaToOtherJournal = async (materia: Materia, targetBlockId: string) => {
    try {
      await updateMateria(materia.id, {
        bloco_id: targetBlockId,
        ordem: 1,
        retranca: materia.retranca
      });
      
      toast({
        title: "Matéria transferida",
        description: "A matéria foi movida com sucesso para o outro espelho.",
        variant: "default"
      });
    } catch (error) {
      console.error("Erro ao mover matéria:", error);
      toast({
        title: "Erro",
        description: "Não foi possível mover a matéria para o outro espelho.",
        variant: "destructive"
      });
    }
  };

  return {
    isDualViewActive,
    secondaryJournal,
    activateDualView,
    deactivateDualView,
    selectSecondaryJournal,
    moveMateriaToOtherJournal
  };
};
