
import { Bloco, Materia, Telejornal } from "@/types";
import { generateClipRetrancaPDF } from "@/utils/clip-retranca-pdf-utils";
import { generateGCTXT } from "@/utils/gc-txt-utils";

interface UseNewsScheduleActionsProps {
  currentTelejornal: Telejornal | null;
  blocks: (Bloco & { items: Materia[], totalTime: number })[];
  setShowTeleprompter: (show: boolean) => void;
}

export const useNewsScheduleActions = ({
  currentTelejornal,
  blocks,
  setShowTeleprompter
}: UseNewsScheduleActionsProps) => {
  const handleViewTeleprompter = () => {
    setShowTeleprompter(true);
  };

  const handleExportClipRetranca = () => {
    if (!currentTelejornal || blocks.length === 0) return;
    
    try {
      generateClipRetrancaPDF(blocks, currentTelejornal);
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
    }
  };

  const handleExportGC = () => {
    if (!currentTelejornal || blocks.length === 0) return;
    
    try {
      generateGCTXT(blocks, currentTelejornal);
    } catch (error) {
      console.error("Erro ao exportar GC TXT:", error);
    }
  };

  return {
    handleViewTeleprompter,
    handleExportClipRetranca,
    handleExportGC
  };
};
