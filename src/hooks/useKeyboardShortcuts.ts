
import { useEffect, useRef } from 'react';
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
  const lastOperationRef = useRef<number>(0);
  const DEBOUNCE_DELAY = 300; // 300ms between operations

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

      const now = Date.now();

      // Copy functionality (Ctrl+C) - with debouncing
      if (event.ctrlKey && event.key === 'c' && !isEditingText) {
        if (selectedMateria && now - lastOperationRef.current > DEBOUNCE_DELAY) {
          event.preventDefault();
          lastOperationRef.current = now;
          onCopy(selectedMateria);
        }
      }

      // Paste functionality (Ctrl+V) - with debouncing and conflict resolution
      if (event.ctrlKey && event.key === 'v' && !isEditingText) {
        if (now - lastOperationRef.current > DEBOUNCE_DELAY) {
          event.preventDefault();
          lastOperationRef.current = now;
          
          // Priority: Block paste over materia paste if both exist
          if (copiedBlock && onPasteBlock) {
            console.log('Colando bloco:', copiedBlock.nome);
            onPasteBlock();
          } else {
            onPaste();
          }
        } else {
          console.log('Operação de colar muito rápida, ignorando...');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedMateria, onCopy, onPaste, isEspelhoOpen, copiedBlock, onPasteBlock]);
};
