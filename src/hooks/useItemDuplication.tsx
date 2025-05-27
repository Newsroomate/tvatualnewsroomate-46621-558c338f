
import { useToast } from "@/hooks/use-toast";
import { Bloco, Materia, Telejornal } from "@/types";
import { createMateria } from "@/services/api";
import { findHighestPageNumber } from "@/components/news-schedule/utils";

interface UseItemDuplicationProps {
  blocks: (Bloco & { items: Materia[], totalTime: number })[];
  setBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[], totalTime: number })[]>>;
  currentTelejornal: Telejornal | null;
}

export const useItemDuplication = ({
  blocks,
  setBlocks,
  currentTelejornal
}: UseItemDuplicationProps) => {
  const { toast } = useToast();

  const handleDuplicateItem = async (materia: Materia) => {
    // Can't duplicate items if espelho is not open
    if (!currentTelejornal?.espelho_aberto) {
      toast({
        title: "Espelho fechado",
        description: "Você precisa abrir o espelho para duplicar matérias.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const bloco = blocks.find(b => b.id === materia.bloco_id);
      if (!bloco) return;
      
      // Use the highest page number + 1 across all blocks
      const nextPage = (findHighestPageNumber(blocks) + 1).toString();
      
      const duplicatedMateriaInput = {
        bloco_id: materia.bloco_id,
        pagina: nextPage,
        retranca: `${materia.retranca} (Cópia)`,
        clip: materia.clip || "",
        duracao: materia.duracao || 0,
        status: materia.status || "draft" as const,
        reporter: materia.reporter || "",
        ordem: bloco.items.length + 1,
        texto: materia.texto || "",
        cabeca: materia.cabeca || ""
      };
      
      const duplicatedMateria = await createMateria(duplicatedMateriaInput);
      
      // Update UI
      setBlocks(blocks.map(block => {
        if (block.id === materia.bloco_id) {
          const updatedItems = [...block.items, duplicatedMateria];
          return {
            ...block,
            items: updatedItems,
            totalTime: updatedItems.reduce((sum, item) => sum + item.duracao, 0)
          };
        }
        return block;
      }));
      
    } catch (error) {
      console.error("Erro ao duplicar matéria:", error);
      toast({
        title: "Erro",
        description: "Não foi possível duplicar a matéria",
        variant: "destructive"
      });
    }
  };

  return {
    handleDuplicateItem
  };
};
