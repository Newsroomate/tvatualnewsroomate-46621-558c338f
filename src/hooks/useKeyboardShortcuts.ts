
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
      if (event.ctrlKey && event.key === 'c' && selectedMateria && onCopy) {
        event.preventDefault();
        onCopy(selectedMateria);
        return;
      }

      // Ctrl+V - Paste materia
      if (event.ctrlKey && event.key === 'v' && isEspelhoOpen) {
        event.preventDefault();
        if (onPaste) {
          onPaste();
        }
        return;
      }

      // Ctrl+Shift+V - Paste bloco
      if (event.ctrlKey && event.shiftKey && event.key === 'V' && isEspelhoOpen) {
        event.preventDefault();
        if (onPasteBloco) {
          onPasteBloco();
        }
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedMateria, onCopy, onPaste, onPasteBloco, isEspelhoOpen]);
};
