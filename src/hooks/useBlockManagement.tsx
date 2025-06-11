
import { useState, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Bloco, Materia, Telejornal } from "@/types";
import { createBloco, updateBloco, deleteBloco } from "@/services/blocos-api";

interface UseBlockManagementProps {
  blocks: (Bloco & { items: Materia[], totalTime: number })[];
  setBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[], totalTime: number })[]>>;
  selectedJournal: string | null;
  currentTelejornal: Telejornal | null;
  blocosQuery: any;
}

export const useBlockManagement = ({
  blocks,
  setBlocks,
  selectedJournal,
  currentTelejornal,
  blocosQuery
}: UseBlockManagementProps) => {
  const [isCreatingFirstBlock, setIsCreatingFirstBlock] = useState(false);
  const blockCreationInProgress = useRef(false);
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

  const handleAddFirstBlock = async () => {
    if (!selectedJournal || !currentTelejornal?.espelho_aberto) {
      console.log("Cannot create first block - journal not selected or espelho not open");
      return;
    }
    
    try {
      // Double check to make sure we don't have blocks already
      const existingBlocks = await blocosQuery.refetch();
      
      console.log(`Checking for existing blocks for telejornal ${selectedJournal}:`, existingBlocks.data);
      
      // If blocks already exist, just return without creating a new one
      if (existingBlocks && existingBlocks.data && existingBlocks.data.length > 0) {
        console.log("Blocks already exist for this journal, skipping creation");
        setBlocks(blocks => blocks.length ? blocks : existingBlocks.data.map(b => ({ ...b, items: [], totalTime: 0 })));
        return;
      }
      
      console.log("No existing blocks found, creating first block");
      
      // Criar apenas o bloco básico vazio
      const newBlock = await createBasicBlock(selectedJournal, "Bloco 1", 1);
      
      console.log("First block created successfully:", newBlock);
      
      // Immediately update the UI
      setBlocks([newBlock]);
      
      // Force refresh the blocks query
      blocosQuery.refetch();
      
      return newBlock;
    } catch (error) {
      console.error("Erro ao adicionar bloco inicial:", error);
      
      // If the error is a duplicate key error, we can try to fetch the blocks again
      if (error instanceof Error && error.message.includes("duplicate key value")) {
        console.log("Duplicate error detected, attempting to refetch blocks");
        blocosQuery.refetch();
      } else {
        // For other errors, show a toast
        toast({
          title: "Erro",
          description: "Não foi possível adicionar o bloco inicial",
          variant: "destructive"
        });
      }
      
      throw error;
    }
  };

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
    isCreatingFirstBlock,
    setIsCreatingFirstBlock,
    blockCreationInProgress,
    handleAddFirstBlock,
    handleAddBlock,
    handleRenameBlock,
    handleDeleteBlock
  };
};
