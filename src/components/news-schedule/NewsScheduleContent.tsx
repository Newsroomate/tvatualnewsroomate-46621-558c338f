
import { useRef } from "react";
import { Bloco, Materia, Telejornal } from "@/types";
import { ScheduleContent } from "./ScheduleContent";

type BlockWithItems = Bloco & { 
  items: Materia[];
  totalTime: number;
};

interface NewsScheduleContentProps {
  selectedJournal: string | null;
  currentTelejornal: Telejornal | null;
  blocks: BlockWithItems[];
  isLoading: boolean;
  isCreatingFirstBlock: boolean;
  newItemBlock: string | null;
  onOpenRundown: () => void;
  onAddFirstBlock: () => void;
  onAddBlock: () => void;
  onAddItem: (blockId: string) => void;
  onEditItem: (materia: Materia) => void;
  onDeleteItem: (materia: Materia) => void;
  onDuplicateItem: (materia: Materia) => void;
  onRenameBlock: (blockId: string, newName: string) => void;
  onDeleteBlock: (blockId: string) => void;
  journalPrefix?: string;
  onBatchDeleteItems: (items: Materia[]) => void;
  isDeleting: boolean;
  onPasteMaterias: (materiasData: Partial<Materia>[], targetMateria?: Materia) => void;
}

export const NewsScheduleContent = ({
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
}: NewsScheduleContentProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto p-4 pb-32 space-y-6"
      style={{ 
        scrollBehavior: 'smooth',
        paddingBottom: 'max(8rem, 20vh)' // Responsive bottom padding
      }}
    >
      <ScheduleContent
        selectedJournal={selectedJournal}
        currentTelejornal={currentTelejornal}
        blocks={blocks}
        isLoading={isLoading}
        isCreatingFirstBlock={isCreatingFirstBlock}
        newItemBlock={newItemBlock}
        onOpenRundown={onOpenRundown}
        onAddFirstBlock={onAddFirstBlock}
        onAddBlock={onAddBlock}
        onAddItem={onAddItem}
        onEditItem={onEditItem}
        onDeleteItem={onDeleteItem}
        onDuplicateItem={onDuplicateItem}
        onRenameBlock={onRenameBlock}
        onDeleteBlock={onDeleteBlock}
        journalPrefix={journalPrefix}
        onBatchDeleteItems={onBatchDeleteItems}
        isDeleting={isDeleting}
        onPasteMaterias={onPasteMaterias}
      />
    </div>
  );
};
