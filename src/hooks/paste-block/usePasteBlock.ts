
import { useUnifiedClipboard } from '../unified-clipboard';

interface CopiedBlock {
  id: string;
  nome: string;
  ordem: number;
  materias: any[];
  is_copied_block: true;
}

interface UsePasteBlockProps {
  selectedJournal: string | null;
  currentTelejornal: any;
  copiedBlock: CopiedBlock | null;
  clearClipboard: () => void;
  refreshBlocks: () => void;
}

export const usePasteBlock = ({
  selectedJournal,
  currentTelejornal,
  copiedBlock,
  clearClipboard,
  refreshBlocks
}: UsePasteBlockProps) => {
  
  const unifiedClipboard = useUnifiedClipboard({
    selectedJournal,
    currentTelejornal,
    refreshBlocks
  });
  
  const pasteBlock = async () => {
    // Usar o sistema unificado para colar bloco
    const result = await unifiedClipboard.pasteBlock();
    
    if (result.success) {
      console.log('Bloco colado com sucesso via sistema unificado');
    } else {
      console.error('Erro ao colar bloco:', result.error);
    }
  };

  return { pasteBlock };
};
