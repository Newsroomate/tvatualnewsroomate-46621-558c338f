import { Bloco, Materia, Telejornal } from "@/types";
import { Button } from "@/components/ui/button";
import { PlusCircle, Lock } from "lucide-react";
import { NewsBlock } from "./NewsBlock";
import { useAuth } from "@/context/AuthContext";
import { canModifyMaterias } from "@/utils/permission";

interface ScheduleContentProps {
  selectedJournal: string | null;
  currentTelejornal: Telejornal | null;
  blocks: (Bloco & { items: Materia[], totalTime: number })[];
  isLoading: boolean;
  isCreatingFirstBlock: boolean;
  newItemBlock: string | null;
  onOpenRundown: () => void;
  onAddFirstBlock: () => void;
  onAddBlock: () => void;
  onAddItem: (blockId: string) => void;
  onEditItem: (item: Materia) => void;
  onDeleteItem: (item: Materia) => void;
  onDuplicateItem: (item: Materia) => void;
  onBatchDeleteItems: (items: Materia[]) => void;
  onRenameBlock: (blockId: string, newName: string) => void;
  onDeleteBlock: (blockId: string) => void;
  journalPrefix?: string;
  isDeleting?: boolean;
}

export const ScheduleContent = ({
  selectedJournal,
  currentTelejornal,
  blocks,
  isLoading,
  isCreatingFirstBlock,
  newItemBlock,
  onOpenRundown,
  onAddFirstBlock,
  onAddBlock,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onDuplicateItem,
  onBatchDeleteItems,
  onRenameBlock,
  onDeleteBlock,
  journalPrefix = "default",
  isDeleting = false
}: ScheduleContentProps) => {
  const { profile } = useAuth();
  const canModify = canModifyMaterias(profile);

  if (!selectedJournal) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-gray-500">Selecione um telejornal no painel esquerdo</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-gray-500">Carregando espelho...</p>
      </div>
    );
  }

  if (!currentTelejornal?.espelho_aberto) {
    return (
      <div className="flex flex-col items-center justify-center h-32 gap-3">
        <div className="flex items-center text-gray-500">
          <Lock className="h-5 w-5 mr-2" />
          <p>O espelho está fechado. Abra o espelho para adicionar e editar matérias.</p>
        </div>
        <Button onClick={onOpenRundown} variant="default">
          Abrir Espelho Agora
        </Button>
      </div>
    );
  }

  if (blocks.length === 0 && isCreatingFirstBlock) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-gray-500">Criando bloco inicial...</p>
      </div>
    );
  }

  if (blocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 gap-3">
        <p className="text-gray-500">Nenhum bloco encontrado</p>
        <Button onClick={onAddFirstBlock} variant="default">
          Adicionar Bloco Inicial
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {blocks.map((block, index) => (
        <div key={block.id} className="mb-8">
          <NewsBlock
            block={block}
            newItemBlock={newItemBlock}
            onAddItem={onAddItem}
            onEditItem={onEditItem}
            onDeleteItem={onDeleteItem}
            onDuplicateItem={onDuplicateItem}
            onBatchDeleteItems={onBatchDeleteItems}
            isEspelhoOpen={!!currentTelejornal?.espelho_aberto}
            onRenameBlock={onRenameBlock}
            onDeleteBlock={onDeleteBlock}
            journalPrefix={journalPrefix}
            isDeleting={isDeleting}
          />
          {/* Add extra spacing after the last block for better visibility */}
          {index === blocks.length - 1 && (
            <div className="h-16" />
          )}
        </div>
      ))}
    </div>
  );
};
