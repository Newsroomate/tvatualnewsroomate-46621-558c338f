
import { useEffect } from 'react';
import { Materia } from '@/types';

interface UseKeyboardShortcutsProps {
  selectedMateria: Materia | null;
  onCopy: (materia: Materia) => void;
  onPaste: () => void;
  isEspelhoOpen?: boolean;
}

export const useKeyboardShortcuts = ({
  selectedMateria,
  onCopy,
  onPaste,
  isEspelhoOpen = false
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
        (activeElement as any).contentEditable === 'true' ||
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
        onPaste();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedMateria, onCopy, onPaste, isEspelhoOpen]);
};
