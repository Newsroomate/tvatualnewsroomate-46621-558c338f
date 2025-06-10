
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Bloco, Materia, Telejornal } from "@/types";
import { createMateria } from "@/services/materias-api";
import { findHighestPageNumber } from "@/components/news-schedule/utils";

interface UseItemCreationProps {
  blocks: (Bloco & { items: Materia[], totalTime: number })[];
  setBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[], totalTime: number })[]>>;
  currentTelejornal: Telejornal | null;
}

export const useItemCreation = ({
  blocks,
  setBlocks,
  currentTelejornal
}: UseItemCreationProps) => {
  const [newItemBlock, setNewItemBlock] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAddItem = async (blocoId: string) => {
    // Can't add items if espelho is not open
    if (!currentTelejornal?.espelho_aberto) {
      toast({
        title: "Espelho fechado",
        description: "Você precisa abrir o espelho para adicionar matérias.",
        variant: "destructive"
      });
      return;
    }
    
    setNewItemBlock(blocoId);
    
    try {
      const bloco = blocks.find(b => b.id === blocoId);
      if (!bloco) {
        console.error("Bloco não encontrado:", blocoId);
        setNewItemBlock(null);
        return;
      }
      
      // Use the highest page number + 1 across all blocks
      const nextPage = (findHighestPageNumber(blocks) + 1).toString();
      
      const novaMateriaInput = {
        bloco_id: blocoId,
        pagina: nextPage,
        retranca: "Nova Matéria",
        clip: "",
        tempo_clip: "",
        duracao: 0,
        texto: "",
        cabeca: "",
        gc: "",
        status: "draft" as const,
        reporter: "",
        local_gravacao: "",
        tags: [],
        equipamento: "",
        horario_exibicao: null,
        tipo_material: "",
        ordem: bloco.items.length + 1
      };
      
      console.log("Criando matéria com dados:", novaMateriaInput);
      
      const novaMateria = await createMateria(novaMateriaInput);
      
      console.log("Matéria criada com sucesso:", novaMateria);
      
      // Update UI
      setBlocks(prevBlocks => prevBlocks.map(block => {
        if (block.id === blocoId) {
          const updatedItems = [...block.items, novaMateria];
          return {
            ...block,
            items: updatedItems,
            totalTime: updatedItems.reduce((sum, item) => sum + (item.duracao || 0), 0)
          };
        }
        return block;
      }));
      
      setNewItemBlock(null);
      
      toast({
        title: "Matéria adicionada",
        description: "Nova matéria criada com sucesso",
      });
      
    } catch (error) {
      console.error("Erro ao adicionar matéria:", error);
      setNewItemBlock(null);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a matéria",
        variant: "destructive"
      });
    }
  };

  return {
    newItemBlock,
    setNewItemBlock,
    handleAddItem
  };
};
