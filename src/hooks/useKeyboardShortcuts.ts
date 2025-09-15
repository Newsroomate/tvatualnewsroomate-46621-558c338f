
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
        
        console.log('Ctrl+V pressionado - Estado do clipboard:', {
          copiedBlock: copiedBlock ? {
            nome: copiedBlock.nome,
            materiasCount: copiedBlock.materias.length
          } : null,
          hasPasteBlock: !!onPasteBlock,
          sessionStorageMateria: sessionStorage.getItem('copiedMateria') ? 'exists' : 'empty',
          sessionStorageBlock: sessionStorage.getItem('copiedBlock') ? 'exists' : 'empty'
        });
        
        // Se há um bloco copiado, priorizar colar o bloco
        if (copiedBlock && onPasteBlock) {
          console.log('Colando bloco via Ctrl+V:', copiedBlock.nome);
          onPasteBlock();
        } else {
          // Caso contrário, colar matéria individual
          console.log('Colando matéria via Ctrl+V');
          onPaste();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedMateria, onCopy, onPaste, isEspelhoOpen, copiedBlock, onPasteBlock]);
};
