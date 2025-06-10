import { Plus } from "lucide-react";
import { Bloco, Materia, Telejornal } from "@/types";
import { NewsBlock } from "./NewsBlock";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./EmptyState";

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
  onRenameBlock: (blockId: string, newName: string) => void;
  onDeleteBlock: (blockId: string) => void;
  journalPrefix?: string;
  onBatchDeleteItems: (items: Materia[]) => void;
  isDeleting?: boolean;
  onPasteMaterias?: (materiasData: Partial<Materia>[], targetMateria?: Materia) => void;
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
  onRenameBlock,
  onDeleteBlock,
  journalPrefix,
  onBatchDeleteItems,
  isDeleting,
  onPasteMaterias
}: ScheduleContentProps) => {
  if (!selectedJournal) {
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

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando blocos...</p>
        </div>
      </div>
    );
  }

  if (blocks.length === 0 && !isCreatingFirstBlock) {
    return (
      <EmptyState
        currentTelejornal={currentTelejornal}
        onAddFirstBlock={onAddFirstBlock}
        onOpenRundown={onOpenRundown}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Loading indicator for first block creation */}
      {isCreatingFirstBlock && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Criando primeiro bloco...</p>
        </div>
      )}

      {/* News blocks */}
      {blocks.map((block) => (
        <NewsBlock
          key={block.id}
          block={block}
          newItemBlock={newItemBlock}
          onAddItem={onAddItem}
          onEditItem={onEditItem}
          onDeleteItem={onDeleteItem}
          onDuplicateItem={onDuplicateItem}
          isEspelhoOpen={!!currentTelejornal?.espelho_aberto}
          onRenameBlock={onRenameBlock}
          onDeleteBlock={onDeleteBlock}
          journalPrefix={journalPrefix}
          onBatchDeleteItems={onBatchDeleteItems}
          isDeleting={isDeleting}
          onPasteMaterias={onPasteMaterias}
        />
      ))}

      {/* Add new block button */}
      {blocks.length > 0 && currentTelejornal?.espelho_aberto && (
        <div className="flex justify-center py-6">
          <Button
            onClick={onAddBlock}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar Novo Bloco</span>
          </Button>
        </div>
      )}
    </div>
  );
};
