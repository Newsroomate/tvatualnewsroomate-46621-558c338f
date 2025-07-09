
import { useEffect, useRef } from 'react';
import { Materia } from '@/types';
import { useClipboard } from '@/context/clipboard';

interface UseKeyboardShortcutsProps {
  selectedMateria: Materia | null;
  onPaste: () => void;
  isEspelhoOpen?: boolean;
  onPasteBlock?: () => void;
}

export const useKeyboardShortcuts = ({
  selectedMateria,
  onPaste,
  isEspelhoOpen = false,
  onPasteBlock
}: UseKeyboardShortcutsProps) => {
  const { copyMateria, copiedBlock, validateClipboard } = useClipboard();
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

      // Copy functionality (Ctrl+C) - with validation and debouncing
      if (event.ctrlKey && event.key === 'c' && !isEditingText) {
        if (selectedMateria && now - lastOperationRef.current > DEBOUNCE_DELAY) {
          event.preventDefault();
          lastOperationRef.current = now;
          console.log('⌨️ Ctrl+C detectado para matéria:', selectedMateria.retranca);
          copyMateria(selectedMateria);
        }
      }

      // Paste functionality (Ctrl+V) - with validation and conflict resolution
      if (event.ctrlKey && event.key === 'v' && !isEditingText) {
        if (now - lastOperationRef.current > DEBOUNCE_DELAY) {
          event.preventDefault();
          lastOperationRef.current = now;
          
          // Validate clipboard before pasting
          if (!validateClipboard()) {
            console.log('❌ Clipboard inválido ou vazio');
            return;
          }
          
          // Priority: Block paste over materia paste if both exist
          if (copiedBlock && onPasteBlock) {
            console.log('⌨️ Ctrl+V: Colando bloco:', copiedBlock.nome);
            onPasteBlock();
          } else {
            console.log('⌨️ Ctrl+V: Colando matéria');
            onPaste();
          }
        } else {
          console.log('⚠️ Operação de colar muito rápida, ignorando...');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedMateria, copyMateria, onPaste, isEspelhoOpen, copiedBlock, onPasteBlock, validateClipboard]);
};
