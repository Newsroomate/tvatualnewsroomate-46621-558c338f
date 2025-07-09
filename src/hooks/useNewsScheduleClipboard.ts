
import { useClipboard } from "@/hooks/useClipboard";
import { usePasteMateria } from "@/hooks/paste-materia";
import { usePasteBlock } from "@/hooks/paste-block";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Materia, Bloco } from "@/types";

type BlockWithItems = Bloco & { 
  items: Materia[];
  totalTime: number;
};

interface UseNewsScheduleClipboardProps {
  blocks: BlockWithItems[];
  setBlocksWrapper: (updater: (blocks: any[]) => any[]) => void;
  selectedMateria: Materia | null;
  selectedJournal: string | null;
  currentTelejornal: any;
}

export const useNewsScheduleClipboard = ({
  blocks,
  setBlocksWrapper,
  selectedMateria,
  selectedJournal,
  currentTelejornal
}: UseNewsScheduleClipboardProps) => {
  const queryClient = useQueryClient();

  // Clipboard functionality UNIFICADO
  const { 
    copiedMateria, 
    copiedBlock, 
    copyMateria, 
    copyBlock, 
    clearClipboard, 
    hasCopiedMateria, 
    hasCopiedBlock,
    clipboardItem,
    getClipboardInfo 
  } = useClipboard();
  
  // Enhanced paste functionality with optimistic updates
  const { pasteMateria } = usePasteMateria({
    blocks,
    setBlocks: setBlocksWrapper,
    selectedMateria,
    copiedMateria,
    clearClipboard
  });

  // Block paste functionality
  const { pasteBlock } = usePasteBlock({
    selectedJournal,
    currentTelejornal,
    copiedBlock,
    clearClipboard,
    refreshBlocks: () => {
      if (selectedJournal) {
        queryClient.invalidateQueries({ queryKey: ['blocos', selectedJournal] });
      }
    }
  });

  // FUNÇÃO UNIFICADA DE PASTE - corrige a lógica de priorização
  const handleUnifiedPaste = async () => {
    const clipboardInfo = getClipboardInfo();
    
    if (!clipboardInfo) {
      toast({
        title: "Nada para colar",
        description: "Copie uma matéria ou bloco primeiro",
        variant: "destructive"
      });
      return;
    }

    console.log('=== PASTE UNIFICADO ===', {
      type: clipboardInfo.type,
      item: clipboardInfo.itemName,
      age: Math.round(clipboardInfo.age / 1000) + 's',
      session: clipboardInfo.isOwnSession ? 'própria' : 'externa'
    });

    // Executar paste baseado no tipo do último item copiado
    if (clipboardInfo.type === 'materia') {
      await pasteMateria();
    } else if (clipboardInfo.type === 'block') {
      await pasteBlock();
    }
  };

  return {
    copyMateria,
    copyBlock,
    hasCopiedMateria,
    hasCopiedBlock,
    copiedBlock,
    clipboardInfo: getClipboardInfo(),
    handleUnifiedPaste
  };
};
