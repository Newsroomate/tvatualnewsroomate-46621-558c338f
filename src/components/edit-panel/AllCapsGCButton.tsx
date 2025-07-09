
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

    // Obter o texto selecionado
    const selectedText = value.substring(start, end);
    
    // Converter para maiúsculas
    const upperCaseText = selectedText.toUpperCase();
    
    // Construir o novo texto
    const newValue = value.substring(0, start) + upperCaseText + value.substring(end);
    
    // Atualizar o valor
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
      ALL CAPS
    </Button>
  );
};
