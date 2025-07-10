
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Type, Info } from "lucide-react";
import { useState, useEffect } from "react";

interface AllCapsGCButtonProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onTextChange: (newText: string) => void;
}

export const AllCapsGCButton = ({
  textareaRef,
  onTextChange
}: AllCapsGCButtonProps) => {
  const [hasSelection, setHasSelection] = useState(false);

  const checkSelection = () => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const hasSelectedText = textarea.selectionStart !== textarea.selectionEnd;
    setHasSelection(hasSelectedText);
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleSelectionChange = () => {
      checkSelection();
    };

    textarea.addEventListener('mouseup', handleSelectionChange);
    textarea.addEventListener('keyup', handleSelectionChange);
    textarea.addEventListener('select', handleSelectionChange);

    return () => {
      textarea.removeEventListener('mouseup', handleSelectionChange);
      textarea.removeEventListener('keyup', handleSelectionChange);
      textarea.removeEventListener('select', handleSelectionChange);
    };
  }, [textareaRef]);

  const handleAllCaps = () => {
    if (!textareaRef.current || !hasSelection) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const fullText = textarea.value;
    
    const beforeSelection = fullText.substring(0, start);
    const selectedText = fullText.substring(start, end);
    const afterSelection = fullText.substring(end);
    
    const upperCaseSelection = selectedText.toUpperCase();
    const newText = beforeSelection + upperCaseSelection + afterSelection;
    
    // Update the text
    onTextChange(newText);
    
    // Restore selection after text change
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(start, start + upperCaseSelection.length);
      }
    }, 0);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleAllCaps}
        disabled={!hasSelection}
        className="flex items-center gap-2"
        title={hasSelection ? "Converter seleção para maiúsculas" : "Selecione o texto no campo GC para converter em maiúsculas"}
      >
        <Type className="h-4 w-4" />
        MAIÚSCULAS
      </Button>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 hover:bg-blue-200 cursor-help">
              <Info className="h-3 w-3 text-blue-600" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="text-sm">
              <p className="font-semibold mb-1">Como usar MAIÚSCULAS:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Selecione o texto desejado no campo GC</li>
                <li>Clique no botão MAIÚSCULAS</li>
                <li>Apenas o texto selecionado será convertido</li>
              </ol>
              <p className="text-xs text-muted-foreground mt-2">
                💡 Dica: Use para destacar nomes, títulos ou palavras importantes
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
