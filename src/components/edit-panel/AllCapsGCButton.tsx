
import { Button } from "@/components/ui/button";
import { Type } from "lucide-react";
import { useRef } from "react";

interface AllCapsGCButtonProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (newValue: string) => void;
}

export const AllCapsGCButton = ({
  textareaRef,
  value,
  onChange
}: AllCapsGCButtonProps) => {
  const handleAllCaps = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Se não há texto selecionado
    if (start === end) {
      alert('Selecione o texto que deseja converter para maiúsculas.');
      return;
    }

    // Focar no textarea
    textarea.focus();

    // Obter o texto selecionado
    const selectedText = value.substring(start, end);
    
    // Converter para maiúsculas
    const upperCaseText = selectedText.toUpperCase();
    
    // Tentar usar execCommand para preservar histórico de undo/redo
    try {
      // Usar execCommand para inserir texto, preservando histórico de undo
      if (document.execCommand) {
        // Inserir o texto em maiúsculas (substitui automaticamente o texto selecionado)
        const success = document.execCommand('insertText', false, upperCaseText);
        
        if (success) {
          // Se execCommand funcionou, selecionar o texto inserido
          setTimeout(() => {
            if (textarea) {
              textarea.setSelectionRange(start, start + upperCaseText.length);
            }
          }, 0);
          return; // Sair da função se execCommand funcionou
        }
      }
    } catch (error) {
      console.warn('execCommand não suportado, usando fallback');
    }
    
    // Fallback: método original para navegadores que não suportam execCommand
    const newValue = value.substring(0, start) + upperCaseText + value.substring(end);
    onChange(newValue);
    
    // Restaurar a seleção após a atualização
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(start, start + upperCaseText.length);
      }
    }, 0);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleAllCaps}
      className="flex items-center gap-2"
      title="Converter texto selecionado para maiúsculas"
    >
      <Type className="h-4 w-4" />
      Maiúscula
    </Button>
  );
};
