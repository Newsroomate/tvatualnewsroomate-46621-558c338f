
import { useEffect } from 'react';
import { Materia } from '@/types';

interface UseKeyboardShortcutsProps {
  selectedMateria?: Materia | null;
  onCopy?: (materia: Materia) => void;
  onPaste?: () => void;
  onPasteBloco?: () => void;
  isEspelhoOpen?: boolean;
}

export const useKeyboardShortcuts = ({
  selectedMateria,
  onCopy,
  onPaste,
  onPasteBloco,
  isEspelhoOpen = false
}: UseKeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }

      // Ctrl+C - Copy selected materia
      if (event.ctrlKey && event.key === 'c' && selectedMateria && onCopy && !event.shiftKey) {
        event.preventDefault();
        onCopy(selectedMateria);
        console.log('Copiando matéria via Ctrl+C:', selectedMateria.retranca);
        return;
      }

      // Ctrl+Shift+V - Paste bloco
      if (event.ctrlKey && event.shiftKey && event.key === 'V' && isEspelhoOpen && onPasteBloco) {
        event.preventDefault();
        console.log('Tentando colar bloco via Ctrl+Shift+V');
        onPasteBloco();
        return;
      }

      // Ctrl+V - Paste materia (only if not Shift+V)
      if (event.ctrlKey && event.key === 'v' && !event.shiftKey && isEspelhoOpen && onPaste) {
        event.preventDefault();
        console.log('Tentando colar matéria via Ctrl+V');
        onPaste();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedMateria, onCopy, onPaste, onPasteBloco, isEspelhoOpen]);
};
