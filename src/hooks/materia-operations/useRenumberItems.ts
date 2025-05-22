
import { useState } from "react";
import { Telejornal } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { updateMateria } from "@/services/api";
import { BlockWithItems, logger } from "../useRealtimeMaterias/utils";

export const useRenumberItems = (
  setBlocks?: React.Dispatch<React.SetStateAction<BlockWithItems[]>>,
  currentTelejornal?: Telejornal | null
) => {
  const { toast } = useToast();

  const handleRenumberItems = async (blocks: BlockWithItems[]) => {
    // Can't renumber if espelho is not open
    if (!currentTelejornal?.espelho_aberto) {
      toast({
        title: "Espelho fechado",
        description: "Você precisa abrir o espelho para reorganizar a numeração.",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  const confirmRenumberItems = async (
    blocks: BlockWithItems[], 
    setRenumberConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    let pageNumber = 1;
    
    try {
      // Process blocks in order
      for (const block of blocks) {
        // Process items in each block
        for (let i = 0; i < block.items.length; i++) {
          const item = block.items[i];
          const updatedItem = {
            ...item,
            pagina: pageNumber.toString()
          };
          
          // Update in database
          await updateMateria(item.id, updatedItem);
          
          // Update local state
          block.items[i] = updatedItem;
          
          // Increment page number
          pageNumber++;
        }
      }
      
      // Update blocks state to trigger re-render if setBlocks is provided
      if (setBlocks) {
        setBlocks([...blocks]);
      }
      
      setRenumberConfirmOpen(false);
      
      toast({
        title: "Numeração reorganizada",
        description: "A numeração das matérias foi reorganizada com sucesso.",
      });
    } catch (error) {
      logger.error("Error renumbering items:", error);
      toast({
        title: "Erro",
        description: "Não foi possível reorganizar a numeração",
        variant: "destructive"
      });
    }
  };

  return {
    handleRenumberItems,
    confirmRenumberItems
  };
};
