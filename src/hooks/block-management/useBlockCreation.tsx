
import { useState, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Bloco, Telejornal } from "@/types";
import { useBasicBlockOperations } from "./useBasicBlockOperations";

interface UseBlockCreationProps {
  blocks: (Bloco & { items: any[], totalTime: number })[];
  setBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: any[], totalTime: number })[]>>;
  selectedJournal: string | null;
  currentTelejornal: Telejornal | null;
  blocosQuery: any;
}

export const useBlockCreation = ({
  blocks,
  setBlocks,
  selectedJournal,
  currentTelejornal,
  blocosQuery
}: UseBlockCreationProps) => {
  const [isCreatingFirstBlock, setIsCreatingFirstBlock] = useState(false);
  const blockCreationInProgress = useRef(false);
  const { toast } = useToast();

  const { createBasicBlock } = useBasicBlockOperations({
    selectedJournal,
    currentTelejornal,
    blocks,
    setBlocks,
    blocosQuery
  });

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
      const newBlock = await createBasicBlock(selectedJournal, `Bloco ${nextOrder}`, nextOrder);
      
      // Update UI
      setBlocks([...blocks, newBlock]);
    } catch (error) {
      console.error("Erro ao adicionar bloco:", error);
      
      // If it's a duplicate key error, try to use a different order number
      if (error instanceof Error && error.message.includes("duplicate key value")) {
        console.log("Duplicate block order detected, trying with a different order");
        
        try {
          // Find the highest order number and add 1
          const highestOrder = blocks.reduce((max, block) => 
            block.ordem > max ? block.ordem : max, 0);
          
          const newBlock = await createBasicBlock(selectedJournal, `Bloco ${highestOrder + 1}`, highestOrder + 1);
          
          // Update UI
          setBlocks([...blocks, newBlock]);
          
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

  return {
    isCreatingFirstBlock,
    setIsCreatingFirstBlock,
    blockCreationInProgress,
    handleAddFirstBlock,
    handleAddBlock
  };
};
