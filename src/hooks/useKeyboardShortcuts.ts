
import { useEffect, useCallback } from 'react';
import { useMateriaClipboard } from './useMateriaClipboard';

interface UseKeyboardShortcutsProps {
  selectedMaterias: any[];
  onCopy?: () => void;
  onPaste?: () => void;
  isActive?: boolean;
}

export const useKeyboardShortcuts = ({ 
  selectedMaterias, 
  onCopy, 
  onPaste,
  isActive = true 
}: UseKeyboardShortcutsProps) => {
  const { copySelectedMaterias, pasteAtPosition } = useMateriaClipboard();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isActive) return;

    // Ctrl+C para copiar
    if (event.ctrlKey && event.key === 'c' && !event.altKey && !event.shiftKey) {
      event.preventDefault();
      if (selectedMaterias.length > 0) {
        copySelectedMaterias(selectedMaterias);
        if (onCopy) onCopy();
      }
    }

    // Ctrl+V para colar
    if (event.ctrlKey && event.key === 'v' && !event.altKey && !event.shiftKey) {
      event.preventDefault();
      pasteAtPosition();
      if (onPaste) onPaste();
    }
  }, [selectedMaterias, copySelectedMaterias, pasteAtPosition, onCopy, onPaste, isActive]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    copySelectedMaterias,
    pasteAtPosition
  };
};
