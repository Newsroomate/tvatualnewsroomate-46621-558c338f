
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface EmptyStateProps {
  onAddFirstBlock: () => void;
}

export const EmptyState = ({ onAddFirstBlock }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-32 gap-3">
      <p className="text-gray-500">Nenhum bloco encontrado</p>
      <Button onClick={onAddFirstBlock} variant="default">
        <PlusCircle className="h-4 w-4 mr-2" />
        Adicionar Bloco Inicial
      </Button>
    </div>
  );
};
