
import { Bloco, Materia, Telejornal } from "@/types";
import { useItemCreation } from "./useItemCreation";
import { useItemDuplication } from "./useItemDuplication";
import { useItemDeletion } from "./useItemDeletion";
import { useItemRenumbering } from "./useItemRenumbering";
import { useClipboard } from "@/context/ClipboardContext";
import { toast } from "@/hooks/use-toast";

interface UseItemManagementProps {
  blocks: (Bloco & { items: Materia[], totalTime: number })[];
  setBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[], totalTime: number })[]>>;
  currentTelejornal: Telejornal | null;
}

export const useItemManagement = ({
  blocks,
  setBlocks,
  currentTelejornal
}: UseItemManagementProps) => {
  const {
    newItemBlock,
    setNewItemBlock,
    handleAddItem
  } = useItemCreation({ blocks, setBlocks, currentTelejornal });

  const {
    handleDuplicateItem
  } = useItemDuplication({ blocks, setBlocks, currentTelejornal });

  const {
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    materiaToDelete,
    setMateriaToDelete,
    handleDeleteMateria,
    confirmDeleteMateria
  } = useItemDeletion({ blocks, setBlocks, currentTelejornal });

  const {
    renumberConfirmOpen,
    setRenumberConfirmOpen,
    handleRenumberItems,
    confirmRenumberItems
  } = useItemRenumbering({ blocks, setBlocks, currentTelejornal });

  const { copyBlock, copyItem, pasteBlock, pasteItem, hasClipboardData, getClipboardType } = useClipboard();

  const handleCopyBlock = (block: Bloco & { items: Materia[], totalTime: number }) => {
    if (!currentTelejornal) return;
    
    copyBlock(block, currentTelejornal.id, currentTelejornal.nome);
    toast({
      title: "Bloco copiado",
      description: `Bloco "${block.nome}" copiado para o clipboard.`
    });
  };

  const handleCopyItem = (item: Materia) => {
    if (!currentTelejornal) return;
    
    copyItem(item, currentTelejornal.id, currentTelejornal.nome);
    toast({
      title: "Matéria copiada",
      description: `Matéria "${item.retranca}" copiada para o clipboard.`
    });
  };

  const handlePasteBlock = async (targetOrder?: number) => {
    if (!currentTelejornal?.espelho_aberto) {
      toast({
        title: "Espelho fechado",
        description: "Abra o espelho para colar blocos.",
        variant: "destructive"
      });
      return;
    }

    if (getClipboardType() !== 'block') {
      toast({
        title: "Tipo incorreto",
        description: "Você está tentando colar uma matéria onde se espera um bloco.",
        variant: "destructive"
      });
      return;
    }

    const order = targetOrder || blocks.length + 1;
    await pasteBlock(currentTelejornal.id, order);
  };

  const handlePasteItem = async (targetBlockId: string) => {
    if (!currentTelejornal?.espelho_aberto) {
      toast({
        title: "Espelho fechado",
        description: "Abra o espelho para colar matérias.",
        variant: "destructive"
      });
      return;
    }

    if (getClipboardType() !== 'item') {
      toast({
        title: "Tipo incorreto",
        description: "Você está tentando colar um bloco onde se espera uma matéria.",
        variant: "destructive"
      });
      return;
    }

    const targetBlock = blocks.find(b => b.id === targetBlockId);
    const order = targetBlock ? targetBlock.items.length + 1 : 1;
    await pasteItem(targetBlockId, order);
  };

  return {
    newItemBlock,
    setNewItemBlock,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    materiaToDelete,
    setMateriaToDelete,
    renumberConfirmOpen,
    setRenumberConfirmOpen,
    handleAddItem,
    handleDuplicateItem,
    handleDeleteMateria,
    confirmDeleteMateria,
    handleRenumberItems,
    confirmRenumberItems,
    handleCopyBlock,
    handleCopyItem,
    handlePasteBlock,
    handlePasteItem,
    hasClipboardData,
    getClipboardType
  };
};
