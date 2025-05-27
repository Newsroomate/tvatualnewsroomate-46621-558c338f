
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
  onDuplicateItem: (item: Materia) => void;
  isEspelhoOpen: boolean;
  onRenameBlock: (blockId: string, newName: string) => void;
  onDeleteBlock: (blockId: string) => void;
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
  onDeleteBlock
}: NewsBlockProps) => {
  const { profile } = useAuth();
  const canModify = canModifyMaterias(profile);
  
  return (
    <div key={block.id} className="border border-gray-200 rounded-lg shadow-sm">
      <BlockHeader
        blockName={block.nome}
        totalTime={block.totalTime}
        onAddItem={() => onAddItem(block.id)}
        newItemBlock={newItemBlock}
        blockId={block.id}
        isEspelhoOpen={isEspelhoOpen}
        canAddItem={canModify}
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
        canModifyItems={canModify}
      />
    </div>
  );
};
