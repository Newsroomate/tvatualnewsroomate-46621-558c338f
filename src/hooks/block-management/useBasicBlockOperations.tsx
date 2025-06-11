
import { useToast } from "@/hooks/use-toast";
import { Bloco, Telejornal } from "@/types";
import { createBloco, updateBloco, deleteBloco } from "@/services/blocos-api";

interface UseBasicBlockOperationsProps {
  selectedJournal: string | null;
  currentTelejornal: Telejornal | null;
  blocks: (Bloco & { items: any[], totalTime: number })[];
  setBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: any[], totalTime: number })[]>>;
  blocosQuery: any;
}

export const useBasicBlockOperations = ({
  selectedJournal,
  currentTelejornal,
  blocks,
  setBlocks,
  blocosQuery
}: UseBasicBlockOperationsProps) => {
  const { toast } = useToast();

  const createBasicBlock = async (telejornalId: string, blockName: string, order: number) => {
    // Criar apenas o bloco básico vazio
    const novoBlocoInput = {
      telejornal_id: telejornalId,
      nome: blockName,
      ordem: order
    };
    
    const novoBloco = await createBloco(novoBlocoInput);
    console.log(`Block created: ${novoBloco.nome} with order ${novoBloco.ordem}`);

    toast({
      title: "Bloco criado",
      description: `Bloco "${blockName}" criado com sucesso`,
      variant: "default"
    });

    // Retornar bloco vazio
    return {
      ...novoBloco,
      items: [],
      totalTime: 0
    };
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
    createBasicBlock,
    handleRenameBlock,
    handleDeleteBlock
  };
};
