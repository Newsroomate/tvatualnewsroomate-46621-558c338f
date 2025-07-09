
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
  getClipboardInfo?: () => { type: 'materia' | 'block' | null; hasMateria: boolean; hasBlock: boolean; };
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
  const DEBOUNCE_DELAY = 300;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isEspelhoOpen) return;
      
      const activeElement = document.activeElement as HTMLElement;
      const isEditingText = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true' ||
        activeElement.getAttribute('role') === 'textbox'
      );

      const now = Date.now();

      // Copy functionality (Ctrl+C)
      if (event.ctrlKey && event.key === 'c' && !isEditingText) {
        if (selectedMateria && now - lastOperationRef.current > DEBOUNCE_DELAY) {
          event.preventDefault();
          lastOperationRef.current = now;
          console.log('🎯 Atalho Ctrl+C - Copiando matéria:', selectedMateria.retranca);
          onCopy(selectedMateria);
        }
      }

      // Paste functionality (Ctrl+V) - com lógica baseada em tipo de clipboard
      if (event.ctrlKey && event.key === 'v' && !isEditingText) {
        if (now - lastOperationRef.current > DEBOUNCE_DELAY) {
          event.preventDefault();
          lastOperationRef.current = now;
          
          // Usar getClipboardInfo se disponível, senão fallback para lógica antiga
          if (getClipboardInfo) {
            const clipboardInfo = getClipboardInfo();
            console.log('🎯 Atalho Ctrl+V - Estado do clipboard:', clipboardInfo);
            
            if (clipboardInfo.type === 'block' && clipboardInfo.hasBlock && onPasteBlock) {
              console.log('📦 Colando bloco via atalho');
              onPasteBlock();
            } else if (clipboardInfo.type === 'materia' && clipboardInfo.hasMateria) {
              console.log('📄 Colando matéria via atalho');
              onPaste();
            } else {
              console.log('❌ Nenhum conteúdo válido no clipboard');
            }
          } else {
            // Fallback para lógica antiga (compatibilidade)
            if (copiedBlock && onPasteBlock) {
              console.log('📦 Colando bloco via atalho (fallback)');
              onPasteBlock();
            } else {
              console.log('📄 Colando matéria via atalho (fallback)');
              onPaste();
            }
          }
        } else {
          console.log('⏳ Operação muito rápida, ignorando...');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedMateria, onCopy, onPaste, isEspelhoOpen, copiedBlock, onPasteBlock, getClipboardInfo]);
};
