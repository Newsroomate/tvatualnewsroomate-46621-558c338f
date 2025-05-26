
import { useCallback } from "react";
import { useSavedRundowns } from "./useSavedRundowns";
import { Bloco, Materia, Telejornal } from "@/types";

export const useRundownAutoSave = () => {
  const { saveRundown } = useSavedRundowns();

  const autoSaveRundown = useCallback(async (
    currentTelejornal: Telejornal,
    blocks: (Bloco & { items: Materia[], totalTime: number })[]
  ) => {
    if (!currentTelejornal || blocks.length === 0) {
      return;
    }

    try {
      await saveRundown(currentTelejornal.id, currentTelejornal.nome, blocks);
    } catch (error) {
      console.error("Erro no salvamento automático:", error);
      // Error is already handled in the hook with toast
    }
  }, [saveRundown]);

  return { autoSaveRundown };
};
