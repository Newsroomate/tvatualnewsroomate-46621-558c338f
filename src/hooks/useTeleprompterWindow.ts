
import { useState, useEffect } from "react";
import { Materia, Telejornal, Bloco } from "@/types";
import { teleprompterService } from "@/services/teleprompter-service";
import { logTeleprompterOperation } from "@/utils/teleprompter-utils";

export const useTeleprompterWindow = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openTeleprompter = async (blocks: (Bloco & { items: Materia[] })[], telejornal: Telejornal | null) => {
    logTeleprompterOperation("Opening teleprompter", { blocksCount: blocks.length, telejornal: telejornal?.nome });
    
    try {
      await teleprompterService.openWindow({ blocks, telejornal });
      setIsOpen(true);
      logTeleprompterOperation("Teleprompter opened successfully");
    } catch (error) {
      logTeleprompterOperation("Failed to open teleprompter", error);
      alert('O teleprompter não pôde ser aberto. Verifique se o bloqueador de pop-ups está ativo e permita pop-ups para este site.');
    }
  };

  const focusOnMateria = (materiaId: string) => {
    logTeleprompterOperation("Focusing on materia", { materiaId });
    
    const success = teleprompterService.focusOnMateria(materiaId);
    if (!success) {
      console.warn("Teleprompter window is not open. Please open the teleprompter first.");
    }
    return success;
  };

  const updateTeleprompterData = (blocks: (Bloco & { items: Materia[] })[]) => {
    logTeleprompterOperation("Updating teleprompter data", { blocksCount: blocks.length });
    teleprompterService.updateData(blocks);
  };

  const openSingleMateria = async (materia: Materia, telejornal: Telejornal | null) => {
    logTeleprompterOperation("Opening single materia teleprompter", { materiaId: materia.id, retranca: materia.retranca });
    
    try {
      await teleprompterService.openSingleMateria(materia, telejornal);
      setIsOpen(true);
      logTeleprompterOperation("Single materia teleprompter opened successfully");
    } catch (error) {
      logTeleprompterOperation("Failed to open single materia teleprompter", error);
      alert('O teleprompter não pôde ser aberto. Verifique se o bloqueador de pop-ups está ativo e permita pop-ups para este site.');
    }
  };

  const closeTeleprompter = () => {
    logTeleprompterOperation("Closing teleprompter");
    teleprompterService.closeWindow();
    setIsOpen(false);
  };

  // Setup service message listener and window monitoring
  useEffect(() => {
    const cleanup = teleprompterService.setupMessageListener(() => {
      logTeleprompterOperation("Window ready signal received");
    });

    // Check if window is closed periodically
    const checkInterval = setInterval(() => {
      if (isOpen && !teleprompterService.isOpen()) {
        setIsOpen(false);
        logTeleprompterOperation("Window closed detected");
      }
    }, 2000);

    return () => {
      cleanup();
      clearInterval(checkInterval);
    };
  }, [isOpen]);

  return {
    isOpen: isOpen && teleprompterService.isOpen(),
    openTeleprompter,
    openSingleMateria,
    updateTeleprompterData,
    focusOnMateria,
    closeTeleprompter
  };
};
