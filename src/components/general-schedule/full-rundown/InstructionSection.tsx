
import { useClipboard } from "@/hooks/useClipboard";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Copy } from "lucide-react";

export const InstructionSection = () => {
  const { copiedMateria, hasCopiedMateria } = useClipboard();
  
  return (
    <div className="space-y-3">
      <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Dica:</strong> Clique em uma matéria para selecioná-la, depois use{" "}
          <kbd className="bg-blue-200 px-1 rounded">Ctrl+C</kbd> para copiar com todos os campos preservados. 
          Você pode fechar este modal e colar com{" "}
          <kbd className="bg-blue-200 px-1 rounded">Ctrl+V</kbd> em qualquer espelho aberto, logo abaixo da matéria selecionada.
        </p>
      </div>

      {/* Indicador de área de transferência ativa */}
      {hasCopiedMateria() && copiedMateria && (
        <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
          <div className="flex items-center space-x-2 text-sm text-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <Copy className="h-4 w-4 text-green-600" />
            <span className="font-medium">Área de transferência ativa:</span>
            <Badge variant="outline" className="bg-white text-green-800 border-green-300">
              {copiedMateria.retranca}
            </Badge>
          </div>
          <p className="text-xs text-green-700 mt-1 ml-10">
            Matéria pronta para colar no espelho atual com todos os campos preservados
          </p>
        </div>
      )}
    </div>
  );
};
