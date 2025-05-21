
import { Bloco, Materia } from "@/types";
import { BlockHeader } from "./BlockHeader";
import { BlockContent } from "./BlockContent";
import { useAuth } from "@/context/AuthContext";
import { canModifyMaterias } from "@/utils/permission";

interface NewsBlockProps {
  block: Bloco & { items: Materia[], totalTime: number };
  newItemBlock: string | null;
  onAddItem: (blockId: string) => void;
  onEditItem: (item: Materia) => void;
  onDeleteItem: (item: Materia) => void;
  onRenameBlock?: (blockId: string, newName: string) => Promise<void>;
  onDeleteBlock?: (blockId: string) => Promise<void>;
  isEspelhoOpen: boolean;
}

export const NewsBlock = ({
  block,
  newItemBlock,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onRenameBlock,
  onDeleteBlock,
  isEspelhoOpen
}: NewsBlockProps) => {
  const { profile } = useAuth();
  const canModify = canModifyMaterias(profile);
  
  const handleRenameBlock = async (newName: string) => {
    if (onRenameBlock) {
      await onRenameBlock(block.id, newName);
    }
  };
  
  const handleDeleteBlock = async () => {
    if (onDeleteBlock) {
      await onDeleteBlock(block.id);
    }
  };
  
  return (
    <div key={block.id} className="border border-gray-200 rounded-lg shadow-sm">
      <BlockHeader
        blockName={block.nome}
        totalTime={block.totalTime}
        onAddItem={() => onAddItem(block.id)}
        onRenameBlock={canModify && onRenameBlock ? handleRenameBlock : undefined}
        onDeleteBlock={canModify && onDeleteBlock ? handleDeleteBlock : undefined}
        newItemBlock={newItemBlock}
        blockId={block.id}
        isEspelhoOpen={isEspelhoOpen}
        canAddItem={canModify}
      />
      <BlockContent
        blockId={block.id}
        items={block.items}
        onEditItem={onEditItem}
        onDeleteItem={onDeleteItem}
        isEspelhoOpen={isEspelhoOpen}
        canModifyItems={canModify}
      />
    </div>
  );
};
