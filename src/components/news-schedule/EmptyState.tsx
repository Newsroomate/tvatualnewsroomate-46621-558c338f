
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Telejornal } from "@/types";

interface EmptyStateProps {
  currentTelejornal: Telejornal | null;
  onAddFirstBlock: () => void;
  onOpenRundown: () => void;
}

export const EmptyState = ({
  currentTelejornal,
  onAddFirstBlock,
  onOpenRundown
}: EmptyStateProps) => {
  if (!currentTelejornal) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum telejornal selecionado
          </h3>
          <p className="text-gray-600">
            Selecione um telejornal na barra lateral para começar a editar.
          </p>
        </div>
      </div>
    );
  }

  if (!currentTelejornal.espelho_aberto) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Espelho fechado
          </h3>
          <p className="text-gray-600 mb-4">
            O espelho de {currentTelejornal.nome} está fechado.
          </p>
          <Button onClick={onOpenRundown} variant="default">
            Abrir Espelho
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum bloco encontrado
        </h3>
        <p className="text-gray-600 mb-4">
          Comece criando o primeiro bloco para {currentTelejornal.nome}.
        </p>
        <Button onClick={onAddFirstBlock} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Criar Primeiro Bloco</span>
        </Button>
      </div>
    </div>
  );
};
