
import { useToast } from "@/hooks/use-toast";
import { Bloco, Materia, Telejornal } from "@/types";
import { createBloco, updateBloco, deleteBloco } from "@/services/blocos-api";

interface UseBlockOperationsProps {
  blocks: (Bloco & { items: Materia[], totalTime: number })[];
  setBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[], totalTime: number })[]>>;
  selectedJournal: string | null;
  currentTelejornal: Telejornal | null;
  blocosQuery: any;
}

export const useBlockOperations = ({
  blocks,
  setBlocks,
  selectedJournal,
  currentTelejornal,
  blocosQuery
}: UseBlockOperationsProps) => {
  const { toast } = useToast();

  const handleAddBlock = async () => {
    if (!selectedJournal) return;
    
    // Can't add blocks if espelho is not open
    if (!currentTelejornal?.espelho_aberto) {
      toast({
        title: "Espelho fechado",
        description: "Você precisa abrir o espelho para adicionar blocos.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const nextOrder = blocks.length + 1;
      const novoBlocoInput = {
        telejornal_id: selectedJournal,
        nome: `Bloco ${nextOrder}`,
        ordem: nextOrder
      };
      
      const novoBloco = await createBloco(novoBlocoInput);
      console.log(`New block created: ${novoBloco.nome} with order ${novoBloco.ordem}`);
      
      // Update UI
      setBlocks([...blocks, { 
        ...novoBloco, 
        items: [],
        totalTime: 0
      }]);
    } catch (error) {
      console.error("Erro ao adicionar bloco:", error);
      
      // If it's a duplicate key error, try to use a different order number
      if (error instanceof Error && error.message.includes("duplicate key value")) {
        console.log("Duplicate block order detected, trying with a different order");
        
        try {
          // Find the highest order number and add 1
          const highestOrder = blocks.reduce((max, block) => 
            block.ordem > max ? block.ordem : max, 0);
          
          const novoBlocoInput = {
            telejornal_id: selectedJournal,
            nome: `Bloco ${highestOrder + 1}`,
            ordem: highestOrder + 1
          };
          
          const novoBloco = await createBloco(novoBlocoInput);
          console.log(`New block created with adjusted order: ${novoBloco.nome} with order ${novoBloco.ordem}`);
          
          // Update UI
          setBlocks([...blocks, { 
            ...novoBloco, 
            items: [],
            totalTime: 0
          }]);
          
          return;
        } catch (retryError) {
          console.error("Erro ao tentar criar bloco com ordem diferente:", retryError);
        }
      }
      
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o bloco",
        variant: "destructive"
      });
    }
  };

  const handleRenameBlock = async (blockId: string, newName: string) => {
    if (!selectedJournal || !currentTelejornal?.espelho_aberto) {
      toast({
        title: "Espelho fechado",
        description: "Você precisa abrir o espelho para renomear blocos.",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateBloco(blockId, { nome: newName });
      
      // Update local state
      setBlocks(prevBlocks => 
        prevBlocks.map(block => 
          block.id === blockId 
            ? { ...block, nome: newName }
            : block
        )
      );
      
      // Refresh the blocks query to sync with server
      blocosQuery.refetch();
    } catch (error) {
      console.error("Erro ao renomear bloco:", error);
      toast({
        title: "Erro",
        description: "Não foi possível renomear o bloco",
        variant: "destructive"
      });
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!selectedJournal || !currentTelejornal?.espelho_aberto) {
      toast({
        title: "Espelho fechado",
        description: "Você precisa abrir o espelho para excluir blocos.",
        variant: "destructive"
      });
      return;
    }

    try {
      await deleteBloco(blockId);
      
      // Update local state
      setBlocks(prevBlocks => prevBlocks.filter(block => block.id !== blockId));
      
      // Refresh the blocks query to sync with server
      blocosQuery.refetch();
    } catch (error) {
      console.error("Erro ao excluir bloco:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o bloco",
        variant: "destructive"
      });
    }
  };

  return {
    handleAddBlock,
    handleRenameBlock,
    handleDeleteBlock
  };
};
