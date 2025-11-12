
import { useToast } from "@/hooks/use-toast";
import { Bloco, Materia, Telejornal } from "@/types";
import { createMateria, updateMateriasOrdem } from "@/services/materias-api";
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
      
      // Calculate the position right after the original materia
      const originalIndex = bloco.items.findIndex(item => item.id === materia.id);
      const newOrdem = materia.ordem + 1;
      
      const duplicatedMateriaInput = {
        bloco_id: materia.bloco_id,
        pagina: nextPage,
        retranca: `${materia.retranca} (Cópia)`,
        clip: materia.clip || "",
        duracao: materia.duracao || 0,
        status: materia.status || "draft" as const,
        reporter: materia.reporter || "",
        ordem: newOrdem,
        gc: materia.gc || "",
        texto: materia.texto || "",
        cabeca: materia.cabeca || "",
        tempo_clip: materia.tempo_clip || "",
        tipo_material: materia.tipo_material || "",
        local_gravacao: materia.local_gravacao || "",
        tags: materia.tags || []
        // Note: 'teleprompter', 'observacoes', and 'lauda' fields removed - don't exist in materias table
      };
      
      // Create the duplicated materia
      const duplicatedMateria = await createMateria(duplicatedMateriaInput);
      
      // Update the ordem of existing materias that come after the original
      const materiasToUpdate = bloco.items
        .filter(item => item.ordem >= newOrdem && item.id !== materia.id)
        .map(item => ({
          id: item.id,
          ordem: item.ordem + 1,
          retranca: item.retranca,
          bloco_id: item.bloco_id
        }));
      
      // Update the ordem in the database if there are materias to update
      if (materiasToUpdate.length > 0) {
        await updateMateriasOrdem(materiasToUpdate);
      }
      
      // Update UI - insert the duplicated materia at the correct position
      setBlocks(blocks.map(block => {
        if (block.id === materia.bloco_id) {
          // Create new items array with updated ordem values and insert duplicated item
          const updatedItems = block.items.map(item => {
            if (item.ordem >= newOrdem && item.id !== materia.id) {
              return { ...item, ordem: item.ordem + 1 };
            }
            return item;
          });
          
          // Insert the duplicated materia at the correct position
          updatedItems.splice(originalIndex + 1, 0, duplicatedMateria);
          
          // Sort by ordem to ensure correct display order
          updatedItems.sort((a, b) => a.ordem - b.ordem);
          
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
