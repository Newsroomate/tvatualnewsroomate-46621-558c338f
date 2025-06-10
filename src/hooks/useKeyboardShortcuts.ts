
import { useEffect } from 'react';
import { Materia } from '@/types';

interface UseKeyboardShortcutsProps {
  selectedMateria: Materia | null;
  onCopy: (materia: Materia) => void;
  onPaste: () => void;
  isEspelhoOpen: boolean;
}

export const useKeyboardShortcuts = ({
  selectedMateria,
  onCopy,
  onPaste,
  isEspelhoOpen
}: UseKeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Verificar se Ctrl está pressionado (Cmd no Mac)
      const isCtrlPressed = event.ctrlKey || event.metaKey;
      
      if (!isCtrlPressed) return;

      // Ctrl+C - Copiar matéria selecionada
      if (event.key === 'c' && selectedMateria) {
        event.preventDefault();
        onCopy(selectedMateria);
      }

      // Ctrl+V - Colar matéria (apenas se o espelho estiver aberto)
      if (event.key === 'v' && isEspelhoOpen) {
        event.preventDefault();
        onPaste();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedMateria, onCopy, onPaste, isEspelhoOpen]);
};
