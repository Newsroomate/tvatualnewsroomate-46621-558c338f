
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { BlockWithItems } from "./useRealtimeMaterias/utils";

export const useTeleprompter = (blocks: BlockWithItems[]) => {
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const { toast } = useToast();

  const handleOpenTeleprompter = (shouldOpen: boolean) => {
    if (shouldOpen && blocks.length === 0) {
      toast({
        title: "Sem blocos",
        description: "Não há blocos para exibir no teleprompter.",
        variant: "destructive"
      });
      return;
    }
    
    setShowTeleprompter(shouldOpen);
    
    if (shouldOpen) {
      toast({
        title: "✅ Espelho carregado",
        description: "Espelho carregado no modo Teleprompter com sucesso.",
        variant: "default"
      });
    }
  };

  return {
    showTeleprompter,
    setShowTeleprompter,
    handleOpenTeleprompter
  };
};
