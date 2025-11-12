import { useEffect } from 'react';
import { useUnifiedClipboard } from './useUnifiedClipboard';
import { UseUnifiedClipboardProps } from './types';

interface UseUnifiedKeyboardShortcutsProps extends UseUnifiedClipboardProps {
  onCopyMateria?: (materia: any) => void;
  onCopyBlock?: (block: any, materias: any[]) => void;
  getSelectedMateria?: () => any | null;
  getSelectedBlock?: () => { block: any; materias: any[] } | null;
  isEnabled?: boolean;
}

export const useUnifiedKeyboardShortcuts = (props: UseUnifiedKeyboardShortcutsProps) => {
  const {
    onCopyMateria,
    onCopyBlock,
    getSelectedMateria,
    getSelectedBlock,
    isEnabled = true,
    ...clipboardProps
  } = props;

  const unifiedClipboard = useUnifiedClipboard(clipboardProps);

  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = async (event: KeyboardEvent) => {
      // Ctrl+C ou Cmd+C para copiar
      if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        // Primeiro tentar copiar matéria selecionada
        if (getSelectedMateria) {
          const selectedMateria = getSelectedMateria();
          if (selectedMateria) {
            event.preventDefault();
            unifiedClipboard.copyMateria(selectedMateria);
            if (onCopyMateria) onCopyMateria(selectedMateria);
            return;
          }
        }

        // Se não há matéria selecionada, tentar copiar bloco selecionado
        if (getSelectedBlock) {
          const selectedBlockData = getSelectedBlock();
          if (selectedBlockData) {
            event.preventDefault();
            unifiedClipboard.copyBlock(selectedBlockData.block, selectedBlockData.materias);
            if (onCopyBlock) onCopyBlock(selectedBlockData.block, selectedBlockData.materias);
            return;
          }
        }
      }

      // Ctrl+V ou Cmd+V para colar
      if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        if (unifiedClipboard.hasAnythingCopied()) {
          event.preventDefault();
          await unifiedClipboard.paste();
        }
      }

      // Delete para limpar clipboard
      if (event.key === 'Delete' && event.shiftKey && (event.ctrlKey || event.metaKey)) {
        if (unifiedClipboard.hasAnythingCopied()) {
          event.preventDefault();
          unifiedClipboard.clearClipboard();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    isEnabled,
    unifiedClipboard,
    onCopyMateria,
    onCopyBlock,
    getSelectedMateria,
    getSelectedBlock
  ]);

  return {
    ...unifiedClipboard,
    // Ações via teclado
    shortcuts: {
      copy: 'Ctrl+C / Cmd+C',
      paste: 'Ctrl+V / Cmd+V',
      clear: 'Shift+Ctrl+Delete / Shift+Cmd+Delete'
    }
  };
};