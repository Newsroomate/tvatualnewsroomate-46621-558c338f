
import { useClipboard } from '@/context/ClipboardContext';
import { createBloco, createMateria } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { Bloco, Materia } from '@/types';

interface UseClipboardOperationsProps {
  blocks: (Bloco & { items: Materia[], totalTime: number })[];
  setBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[], totalTime: number })[]>>;
  currentTelejornalId: string | null;
}

export const useClipboardOperations = ({
  blocks,
  setBlocks,
  currentTelejornalId
}: UseClipboardOperationsProps) => {
  const handlePasteBlock = async (data: any, targetTelejornalId: string, targetOrder: number) => {
    try {
      console.log('Pasting block:', data);
      
      // Create the block
      const newBlock = await createBloco({
        nome: data.nome,
        telejornal_id: targetTelejornalId,
        ordem: targetOrder
      });

      // Create all items in the block
      const newItems: Materia[] = [];
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        const newItem = await createMateria({
          bloco_id: newBlock.id,
          ordem: i + 1,
          retranca: item.retranca,
          clip: item.clip,
          duracao: item.duracao,
          pagina: item.pagina,
          reporter: item.reporter,
          status: item.status,
          texto: item.texto,
          cabeca: item.cabeca
        });
        newItems.push(newItem);
      }

      // Update local state
      const totalTime = newItems.reduce((sum, item) => sum + (item.duracao || 0), 0);
      const blockWithItems = {
        ...newBlock,
        items: newItems,
        totalTime
      };

      setBlocks(prev => [...prev, blockWithItems].sort((a, b) => a.ordem - b.ordem));
      
      toast({
        title: "Bloco colado com sucesso",
        description: `Bloco "${data.nome}" foi colado com ${data.items.length} matérias.`
      });
    } catch (error) {
      console.error('Error pasting block:', error);
      toast({
        title: "Erro ao colar bloco",
        description: "Ocorreu um erro ao colar o bloco. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handlePasteItem = async (data: any, targetBlockId: string, targetOrder: number) => {
    try {
      console.log('Pasting item:', data);
      
      const newItem = await createMateria({
        bloco_id: targetBlockId,
        ordem: targetOrder,
        retranca: data.retranca,
        clip: data.clip,
        duracao: data.duracao,
        pagina: data.pagina,
        reporter: data.reporter,
        status: data.status,
        texto: data.texto,
        cabeca: data.cabeca
      });

      // Update local state
      setBlocks(prev => prev.map(block => {
        if (block.id === targetBlockId) {
          const updatedItems = [...block.items, newItem].sort((a, b) => a.ordem - b.ordem);
          const totalTime = updatedItems.reduce((sum, item) => sum + (item.duracao || 0), 0);
          return {
            ...block,
            items: updatedItems,
            totalTime
          };
        }
        return block;
      }));

      toast({
        title: "Matéria colada com sucesso",
        description: `Matéria "${data.retranca}" foi colada no bloco.`
      });
    } catch (error) {
      console.error('Error pasting item:', error);
      toast({
        title: "Erro ao colar matéria",
        description: "Ocorreu um erro ao colar a matéria. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return {
    handlePasteBlock,
    handlePasteItem
  };
};
