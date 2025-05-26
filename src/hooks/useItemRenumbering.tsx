
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Bloco, Materia, Telejornal } from "@/types";
import { updateMateria } from "@/services/api";

interface UseItemRenumberingProps {
  blocks: (Bloco & { items: Materia[], totalTime: number })[];
  setBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[], totalTime: number })[]>>;
  currentTelejornal: Telejornal | null;
}

export const useItemRenumbering = ({
  blocks,
  setBlocks,
  currentTelejornal
}: UseItemRenumberingProps) => {
  const [renumberConfirmOpen, setRenumberConfirmOpen] = useState(false);
  const { toast } = useToast();

  const handleRenumberItems = async () => {
    // Can't renumber if espelho is not open
    if (!currentTelejornal?.espelho_aberto) {
      toast({
        title: "Espelho fechado",
        description: "Você precisa abrir o espelho para reorganizar a numeração.",
        variant: "destructive"
      });
      return;
    }
    
    setRenumberConfirmOpen(true);
  };

  const confirmRenumberItems = async () => {
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
      
      // Update blocks state to trigger re-render
      setBlocks([...blocks]);
      setRenumberConfirmOpen(false);
      
      toast({
        title: "Numeração reorganizada",
        description: "A numeração das matérias foi reorganizada com sucesso.",
      });
    } catch (error) {
      console.error("Error renumbering items:", error);
      toast({
        title: "Erro",
        description: "Não foi possível reorganizar a numeração",
        variant: "destructive"
      });
    }
  };

  return {
    renumberConfirmOpen,
    setRenumberConfirmOpen,
    handleRenumberItems,
    confirmRenumberItems
  };
};
