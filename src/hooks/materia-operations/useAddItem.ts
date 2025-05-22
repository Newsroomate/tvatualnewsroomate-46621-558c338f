
import { useState } from "react";
import { Materia, Telejornal } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { createMateria } from "@/services/api";
import { BlockWithItems, findHighestPageNumber, logger } from "../useRealtimeMaterias/utils";

export const useAddItem = (
  setBlocks?: React.Dispatch<React.SetStateAction<BlockWithItems[]>>,
  currentTelejornal?: Telejornal | null,
  setNewItemBlock?: React.Dispatch<React.SetStateAction<string | null>>
) => {
  // Initialize state if not provided externally
  const [newItemBlockInternal, setNewItemBlockInternal] = useState<string | null>(null);
  
  // Use provided state setter or internal one
  const setNewItemBlockState = setNewItemBlock || setNewItemBlockInternal;
  
  const { toast } = useToast();

  const handleAddItem = async (blocoId: string, blocks: BlockWithItems[]) => {
    // Can't add items if espelho is not open
    if (!currentTelejornal?.espelho_aberto) {
      toast({
        title: "Espelho fechado",
        description: "Você precisa abrir o espelho para adicionar matérias.",
        variant: "destructive"
      });
      return;
    }
    
    setNewItemBlockState(blocoId);
    
    try {
      const bloco = blocks.find(b => b.id === blocoId);
      if (!bloco) return;
      
      // Use the highest page number + 1 across all blocks
      const nextPage = (findHighestPageNumber(blocks) + 1).toString();
      
      const novaMateriaInput = {
        bloco_id: blocoId,
        pagina: nextPage,
        retranca: "Nova Matéria",
        clip: "",
        duracao: 0,
        status: "draft" as const,
        reporter: "",
        ordem: bloco.items.length + 1
      };
      
      const novaMateria = await createMateria(novaMateriaInput);
      
      // Update UI if setBlocks is provided
      if (setBlocks) {
        setBlocks(prevBlocks => prevBlocks.map(block => {
          if (block.id === blocoId) {
            const updatedItems = [...block.items, novaMateria];
            return {
              ...block,
              items: updatedItems,
              totalTime: updatedItems.reduce((sum, item) => sum + item.duracao, 0)
            };
          }
          return block;
        }));
      }
      
      setNewItemBlockState(null);
    } catch (error) {
      logger.error("Erro ao adicionar matéria:", error);
      setNewItemBlockState(null);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a matéria",
        variant: "destructive"
      });
    }
  };

  return {
    newItemBlock: newItemBlockInternal,
    setNewItemBlock: setNewItemBlockState,
    handleAddItem
  };
};
