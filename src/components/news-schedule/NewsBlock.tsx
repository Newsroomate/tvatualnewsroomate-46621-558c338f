
import { useState } from "react";
import { Bloco, Materia } from "@/types";
import { BlockHeader } from "./BlockHeader";
import { BlockContent } from "./BlockContent";

interface NewsBlockProps {
  block: Bloco & { items: Materia[], totalTime: number };
  newItemBlock: string | null;
  onAddItem: (blockId: string) => void;
  onEditItem: (item: Materia) => void;
  onDeleteItem: (item: Materia) => void;
  onDuplicateItem: (item: Materia) => void;
  isEspelhoOpen: boolean;
  onRenameBlock: (blockId: string, newName: string) => void;
  onDeleteBlock: (blockId: string) => void;
  journalPrefix?: string;
}

export const NewsBlock = ({
  block,
  newItemBlock,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onDuplicateItem,
  isEspelhoOpen,
  onRenameBlock,
  onDeleteBlock,
  journalPrefix = "default"
}: NewsBlockProps) => {
  const [isAddingItem, setIsAddingItem] = useState(false);

  const handleAddItem = () => {
    setIsAddingItem(true);
    onAddItem(block.id);
    setTimeout(() => setIsAddingItem(false), 1000);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <BlockHeader
        block={block}
        onAddItem={handleAddItem}
        isEspelhoOpen={isEspelhoOpen}
        isAddingItem={isAddingItem || newItemBlock === block.id}
        onRenameBlock={onRenameBlock}
        onDeleteBlock={onDeleteBlock}
      />
      <BlockContent
        blockId={block.id}
        items={block.items}
        onEditItem={onEditItem}
        onDeleteItem={onDeleteItem}
        onDuplicateItem={onDuplicateItem}
        isEspelhoOpen={isEspelhoOpen}
        journalPrefix={journalPrefix}
      />
    </div>
  );
};
