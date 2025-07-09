
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
  getClipboardInfo?: () => { type: string; timestamp: number; age: number; data: string } | null;
}

export const useKeyboardShortcuts = ({
  selectedMateria,
  onCopy,
  onPaste,
  isEspelhoOpen = false,
  copiedBlock,
  onPasteBlock,
  getClipboardInfo
}: UseKeyboardShortcutsProps) => {
  const lastOperationRef = useRef<number>(0);
  const DEBOUNCE_DELAY = 150; // Reduced for better responsiveness

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
          console.log('Keyboard copy triggered for materia:', selectedMateria.retranca);
          onCopy(selectedMateria);
        }
      }

      // Paste functionality (Ctrl+V) - with improved priority logic
      if (event.ctrlKey && event.key === 'v' && !isEditingText) {
        if (now - lastOperationRef.current > DEBOUNCE_DELAY) {
          event.preventDefault();
          lastOperationRef.current = now;
          
          // Get clipboard info to determine what was copied most recently
          const clipboardInfo = getClipboardInfo?.();
          
          if (clipboardInfo) {
            console.log('Clipboard info:', clipboardInfo);
            
            // Use the most recent item based on timestamp
            if (clipboardInfo.type === 'block' && onPasteBlock) {
              console.log('Pasting block based on timestamp priority');
              onPasteBlock();
            } else if (clipboardInfo.type === 'materia') {
              console.log('Pasting materia based on timestamp priority');
              onPaste();
            } else {
              console.log('Fallback to default paste behavior');
              onPaste();
            }
          } else {
            // Fallback to legacy behavior if no clipboard info available
            if (copiedBlock && onPasteBlock) {
              console.log('Fallback: Pasting block');
              onPasteBlock();
            } else {
              console.log('Fallback: Pasting materia');
              onPaste();
            }
          }
        } else {
          console.log('Paste operation too fast, ignoring...');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedMateria, onCopy, onPaste, isEspelhoOpen, copiedBlock, onPasteBlock, getClipboardInfo]);
};
