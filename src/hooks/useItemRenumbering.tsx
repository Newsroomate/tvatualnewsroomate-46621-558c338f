
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Bloco, Materia, Telejornal } from "@/types";
import { updateMateria } from "@/services/materias-api";

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
      console.log('Starting renumbering process...');
      
      // Create a copy of blocks to update
      const updatedBlocks = [...blocks];
      
      // Process blocks in order
      for (let blockIndex = 0; blockIndex < updatedBlocks.length; blockIndex++) {
        const block = updatedBlocks[blockIndex];
        
        // Process items in each block
        for (let itemIndex = 0; itemIndex < block.items.length; itemIndex++) {
          const item = block.items[itemIndex];
          
          console.log(`Updating materia ${item.id} from page ${item.pagina} to page ${pageNumber}`);
          
          // Prepare the update data with proper typing to include all possible fields
          const updateData: Partial<Materia> = {
            pagina: pageNumber.toString(),
            retranca: item.retranca, // Required field
            duracao: item.duracao,
            ordem: item.ordem,
            bloco_id: item.bloco_id
          };
          
          // Include optional fields only if they exist
          if (item.clip !== undefined) updateData.clip = item.clip;
          if (item.texto !== undefined) updateData.texto = item.texto;
          if (item.cabeca !== undefined) updateData.cabeca = item.cabeca;
          if (item.status !== undefined) updateData.status = item.status;
          if (item.reporter !== undefined) updateData.reporter = item.reporter;
          if (item.local_gravacao !== undefined) updateData.local_gravacao = item.local_gravacao;
          if (item.tags !== undefined) updateData.tags = item.tags;
          if (item.equipamento !== undefined) updateData.equipamento = item.equipamento;
          if (item.horario_exibicao !== undefined) updateData.horario_exibicao = item.horario_exibicao;
          
          // Update in database
          const updatedItem = await updateMateria(item.id, updateData);
          
          // Update local state
          updatedBlocks[blockIndex].items[itemIndex] = {
            ...item,
            pagina: pageNumber.toString()
          };
          
          // Increment page number
          pageNumber++;
        }
      }
      
      // Update blocks state to trigger re-render
      setBlocks(updatedBlocks);
      setRenumberConfirmOpen(false);
      
      console.log('Renumbering completed successfully');
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
