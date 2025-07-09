
import { NewsBlock } from "./NewsBlock";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Materia, Bloco } from "@/types";

type BlockWithItems = Bloco & { 
  items: Materia[];
  totalTime: number;
};

interface NewsScheduleCoreProps {
  blocks: BlockWithItems[];
  totalJournalTime: number;
  isLoading: boolean;
  isCreatingFirstBlock: boolean;
  newItemBlock: string | null;
  deleteConfirmOpen: boolean;
  setDeleteConfirmOpen: (open: boolean) => void;
  renumberConfirmOpen: boolean;
  setRenumberConfirmOpen: (open: boolean) => void;
  isDeleting: boolean;
  selectedMateria: Materia | null;
  
  // Handlers
  handleAddItem: (blockId: string) => void;
  handleDuplicateItem: (item: Materia) => void;
  handleDeleteMateria: (materia: Materia) => void;
  confirmDeleteMateria: () => void;
  handleBatchDeleteMaterias: (materias: Materia[]) => void;
  handleRenumberItems: () => void;
  confirmRenumberItems: () => void;
  handleAddFirstBlock: () => void;
  handleAddBlock: () => void;
  handleRenameBlock: (blockId: string, newName: string) => void;
  handleDeleteBlock: (blockId: string) => void;
  handleDragEndWithLogging: (result: any) => void;
  handleViewTeleprompter: () => void;
  handleSaveModel: () => void;
  handleUseModel: () => void;
  handleModelApplied: () => void;
  handleViewSavedModels: () => void;
  handleMateriaSelect: (materia: Materia | null) => void;
  onOpenRundown: () => void;
  
  // Clipboard functionality
  copyMateria: (materia: Materia) => void;
  copyBlock: (block: any, materias: Materia[]) => void;
  hasCopiedMateria: () => boolean;
  hasCopiedBlock: () => boolean;
  copiedBlock: any;
  clipboardInfo: any;
  
  // Other props
  isDualViewMode: boolean;
  selectedJournal: string | null;
  currentTelejornal: any;
  journalPrefix: string;
  onEditItem: (item: Materia) => void;
}

export const NewsScheduleCore = ({
  blocks,
  totalJournalTime,
  isLoading,
  isCreatingFirstBlock,
  newItemBlock,
  selectedMateria,
  handleAddItem,
  onEditItem,
  handleDuplicateItem,
  handleDeleteMateria,
  handleBatchDeleteMaterias,
  handleAddFirstBlock,
  handleAddBlock,
  handleRenameBlock,
  handleDeleteBlock,
  handleMateriaSelect,
  copyMateria,
  currentTelejornal,
  journalPrefix = "default",
  onOpenRundown
}: NewsScheduleCoreProps) => {
  console.log('NewsScheduleCore: selectedMateria =', selectedMateria?.retranca);
  console.log('NewsScheduleCore: handleMateriaSelect =', !!handleMateriaSelect);

  const handleCopyItem = (item: Materia) => {
    console.log('NewsScheduleCore: Chamando copyMateria para:', item.retranca);
    copyMateria(item);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Carregando espelho...</div>
      </div>
    );
  }

  if (blocks.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum bloco criado ainda
        </h3>
        <p className="text-gray-500 mb-4">
          Crie o primeiro bloco para começar a organizar as matérias
        </p>
        <Button 
          onClick={handleAddFirstBlock} 
          disabled={isCreatingFirstBlock}
          className="inline-flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          {isCreatingFirstBlock ? "Criando..." : "Criar Primeiro Bloco"}
        </Button>
      </div>
    );
  }

  const totalMinutes = Math.floor(totalJournalTime / 60);
  const totalSeconds = totalJournalTime % 60;

  return (
    <div className="space-y-4">
      {/* Header with total time and add block button */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          <span className="font-medium">Tempo total:</span> {totalMinutes}:{totalSeconds.toString().padStart(2, '0')}
        </div>
        <Button 
          onClick={handleAddBlock}
          size="sm"
          disabled={!currentTelejornal?.espelho_aberto}
        >
          <Plus className="w-4 h-4 mr-1" />
          Adicionar Bloco
        </Button>
      </div>

      {/* Blocks */}
      <div className="space-y-4">
        {blocks.map((block) => (
          <NewsBlock
            key={block.id}
            block={block}
            newItemBlock={newItemBlock}
            onAddItem={handleAddItem}
            onEditItem={onEditItem}
            onDeleteItem={handleDeleteMateria}
            onDuplicateItem={handleDuplicateItem}
            onCopyItem={handleCopyItem}
            isEspelhoOpen={currentTelejornal?.espelho_aberto || false}
            onRenameBlock={handleRenameBlock}
            onDeleteBlock={handleDeleteBlock}
            journalPrefix={journalPrefix}
            onBatchDeleteItems={handleBatchDeleteMaterias}
            selectedMateria={selectedMateria}
            onMateriaSelect={handleMateriaSelect}
          />
        ))}
      </div>
    </div>
  );
};
