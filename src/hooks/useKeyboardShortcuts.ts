
import { useEffect } from 'react';
import { Materia } from '@/types';

interface UseKeyboardShortcutsProps {
  selectedMateria: Materia | null;
  onCopy: (materia: Materia) => void;
  onPaste: () => void;
  isEspelhoOpen: boolean;
  copiedBlock?: any;
  onPasteBlock?: (() => void) | null;
}

export const useKeyboardShortcuts = ({
  selectedMateria,
  onCopy,
  onPaste,
  isEspelhoOpen,
  copiedBlock,
  onPasteBlock
}: UseKeyboardShortcutsProps) => {
  
  useEffect(() => {
    const handleKeyboardShortcut = (event: KeyboardEvent) => {
      // Verificar se o usuário está editando texto (não interferir com edição)
      const activeElement = document.activeElement as HTMLElement;
      const isEditingText = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true'
      );

      // Se está editando texto no painel de edição, permitir paste normal
      if (isEditingText && activeElement.closest('.edit-panel-content')) {
        return; // Não interceptar
      }

      // Ctrl+C para copiar matéria selecionada
      if (event.ctrlKey && event.key === 'c' && !isEditingText) {
        if (selectedMateria) {
          event.preventDefault();
          console.log('Ctrl+C: Copiando matéria selecionada:', selectedMateria.retranca);
          onCopy(selectedMateria);
        } else {
          console.log('Ctrl+C: Nenhuma matéria selecionada');
        }
        return;
      }

      // Ctrl+V para colar (prioridade: último item copiado)
      if (event.ctrlKey && event.key === 'v' && !isEditingText) {
        if (!isEspelhoOpen) {
          console.log('Ctrl+V: Tentativa de colar com espelho fechado');
          return;
        }

        event.preventDefault();
        
        console.log('Ctrl+V: Executando paste unificado');
        onPaste();
        return;
      }
    };

    // Adicionar listener com capture para interceptar antes de outros handlers
    document.addEventListener('keydown', handleKeyboardShortcut, true);
    
    return () => {
      document.removeEventListener('keydown', handleKeyboardShortcut, true);
    };
  }, [selectedMateria, onCopy, onPaste, isEspelhoOpen, copiedBlock, onPasteBlock]);
};
