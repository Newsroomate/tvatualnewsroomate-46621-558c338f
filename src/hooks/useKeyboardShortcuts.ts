
import { useEffect } from 'react';
import { Materia } from '@/types';

interface BlocoClipboard {
  id: string;
  nome: string;
  ordem: number;
  materias: Materia[];
  totalTime: number;
}

interface UseKeyboardShortcutsProps {
  selectedMateria?: Materia | null;
  copiedMateria?: Materia | null;
  copiedBloco?: BlocoClipboard | null;
  onCopy?: (materia: Materia) => void;
  onPaste?: () => void;
  onPasteBloco?: () => void;
  isEspelhoOpen?: boolean;
}

export const useKeyboardShortcuts = ({
  selectedMateria,
  copiedMateria,
  copiedBloco,
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

      // Ctrl+V - Paste (inteligente: detecta automaticamente se é matéria ou bloco)
      if (event.ctrlKey && event.key === 'v' && isEspelhoOpen) {
        event.preventDefault();
        
        // Se há um bloco copiado, colar bloco
        if (copiedBloco && onPasteBloco) {
          console.log('Detectado bloco copiado, colando bloco via Ctrl+V');
          onPasteBloco();
        } 
        // Se há uma matéria copiada, colar matéria
        else if (copiedMateria && onPaste) {
          console.log('Detectado matéria copiada, colando matéria via Ctrl+V');
          onPaste();
        }
        return;
      }

      // Ctrl+Shift+V - Paste bloco (atalho alternativo específico para blocos)
      if (event.ctrlKey && event.shiftKey && event.key === 'V' && isEspelhoOpen) {
        event.preventDefault();
        if (onPasteBloco) {
          console.log('Forçando colagem de bloco via Ctrl+Shift+V');
          onPasteBloco();
        }
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedMateria, copiedMateria, copiedBloco, onCopy, onPaste, onPasteBloco, isEspelhoOpen]);
};
