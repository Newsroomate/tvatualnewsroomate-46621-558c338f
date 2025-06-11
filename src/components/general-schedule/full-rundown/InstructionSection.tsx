
import { Badge } from "@/components/ui/badge";

export const InstructionSection = () => {
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
    </div>
  );
};
