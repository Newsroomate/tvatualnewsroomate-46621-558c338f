
import { useEffect } from 'react';
import { Materia } from '@/types';

interface CopiedBlock {
  id: string;
  nome: string;
  ordem: number;
  materias: Materia[];
  is_copied_block: true;
}

interface UseKeyboardShortcutsProps {
  selectedMateria: Materia | null;
  onCopy: (materia: Materia) => void;
  onPaste: () => void;
  isEspelhoOpen?: boolean;
  // Novos props para suporte a blocos
  copiedBlock?: CopiedBlock | null;
  onPasteBlock?: () => void;
}

export const useKeyboardShortcuts = ({
  selectedMateria,
  onCopy,
  onPaste,
  isEspelhoOpen = false,
  copiedBlock,
  onPasteBlock
}: UseKeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when espelho is open
      if (!isEspelhoOpen) return;
      
      // Check if user is currently editing a text field
      const activeElement = document.activeElement as HTMLElement;
      const isEditingText = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true' ||
        activeElement.getAttribute('role') === 'textbox'
      );

      // Copy functionality (Ctrl+C)
      if (event.ctrlKey && event.key === 'c' && !isEditingText) {
        if (selectedMateria) {
          event.preventDefault();
          onCopy(selectedMateria);
        }
      }

      // Paste functionality (Ctrl+V) - only when NOT editing text
      if (event.ctrlKey && event.key === 'v' && !isEditingText) {
        event.preventDefault();
        
        // Verificar timestamps para determinar qual foi copiado mais recentemente
        const materiaTime = sessionStorage.getItem('copiedMateriaTime');
        const blockTime = sessionStorage.getItem('copiedBlockTime');
        
        console.log('Ctrl+V pressionado - Análise do clipboard:', {
          copiedBlock: copiedBlock ? {
            nome: copiedBlock.nome,
            materiasCount: copiedBlock.materias.length
          } : null,
          hasPasteBlock: !!onPasteBlock,
          sessionStorageMateria: materiaTime ? 'exists' : 'empty',
          sessionStorageBlock: blockTime ? 'exists' : 'empty',
          materiaTimestamp: materiaTime,
          blockTimestamp: blockTime
        });
        
        // Determinar qual foi copiado mais recentemente baseado nos timestamps
        const materiaTimestamp = materiaTime ? parseInt(materiaTime) : 0;
        const blockTimestamp = blockTime ? parseInt(blockTime) : 0;
        
        if (blockTimestamp > materiaTimestamp && copiedBlock && onPasteBlock) {
          console.log('Colando bloco via Ctrl+V (mais recente):', copiedBlock.nome);
          onPasteBlock();
        } else if (materiaTimestamp > 0) {
          console.log('Colando matéria via Ctrl+V (mais recente)');
          onPaste();
        } else {
          console.log('Nenhum item válido para colar');
          onPaste(); // Fallback para mostrar mensagem apropriada
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedMateria, onCopy, onPaste, isEspelhoOpen, copiedBlock, onPasteBlock]);
};
