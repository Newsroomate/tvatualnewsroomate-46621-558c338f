
import { Bloco, Materia } from "@/types";
import { BlockHeader } from "./BlockHeader";
import { BlockContent } from "./BlockContent";
import { useAuth } from "@/context/AuthContext";
import { canModifyMaterias } from "@/utils/permission";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Copy, Clipboard } from "lucide-react";

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
  onCopyBlock?: (block: Bloco & { items: Materia[], totalTime: number }) => void;
  onPasteBlock?: () => void;
  hasClipboardData?: boolean;
  clipboardType?: 'block' | 'item' | null;
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
  onCopyBlock,
  onPasteBlock,
  hasClipboardData,
  clipboardType
}: NewsBlockProps) => {
  const { profile } = useAuth();
  const canModify = canModifyMaterias(profile);
  
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div key={block.id} className="border border-gray-200 rounded-lg shadow-sm cursor-pointer">
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
      </ContextMenuTrigger>
      <ContextMenuContent>
        {canModify && isEspelhoOpen && (
          <ContextMenuItem onClick={() => onCopyBlock?.(block)}>
            <Copy className="h-4 w-4 mr-2" />
            Copiar Bloco
          </ContextMenuItem>
        )}
        {canModify && isEspelhoOpen && hasClipboardData && clipboardType === 'block' && (
          <ContextMenuItem onClick={() => onPasteBlock?.()}>
            <Clipboard className="h-4 w-4 mr-2" />
            Colar Bloco
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};
