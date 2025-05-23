
import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  createBloco, 
  fetchBlocosByTelejornal,
  renameBloco,
  deleteBloco
} from "@/services/api";
import { Bloco, Telejornal } from "@/types";

export const useBlockOperations = (
  selectedJournal: string | null,
  currentTelejornal: Telejornal | null,
  setBlocks?: React.Dispatch<React.SetStateAction<(Bloco & { items: any[], totalTime: number })[]>>
) => {
  const [isCreatingFirstBlock, setIsCreatingFirstBlock] = useState(false);
  const [blockCreationAttempted, setBlockCreationAttempted] = useState(false);
  const { toast } = useToast();
  
  // Track if a block creation is in progress to prevent multiple attempts
  const blockCreationInProgress = useRef(false);

  // Fetch blocks for the selected journal
  const blocosQuery = useQuery({
    queryKey: ['blocos', selectedJournal],
    queryFn: () => selectedJournal ? fetchBlocosByTelejornal(selectedJournal) : Promise.resolve([]),
    enabled: !!selectedJournal,
  });

  // Reset blockCreationAttempted when journal changes
  useEffect(() => {
    if (selectedJournal) {
      setBlockCreationAttempted(false);
    }
  }, [selectedJournal]);

  // Set blockCreationAttempted to true when blocks data is loaded
  useEffect(() => {
    if (blocosQuery.data) {
      setBlockCreationAttempted(true);
    }
  }, [blocosQuery.data]);

  // Function to handle adding the first block specifically
  const handleAddFirstBlock = async () => {
    if (!selectedJournal || !currentTelejornal?.espelho_aberto) {
      console.log("Cannot create first block - journal not selected or espelho not open");
      return;
    }
    
    try {
      // Double check to make sure we don't have blocks already
      const existingBlocks = await fetchBlocosByTelejornal(selectedJournal);
      
      console.log(`Checking for existing blocks for telejornal ${selectedJournal}:`, existingBlocks);
      
      // If blocks already exist, just return without creating a new one
      if (existingBlocks && existingBlocks.length > 0) {
        console.log("Blocks already exist for this journal, skipping creation");
        if (setBlocks) {
          setBlocks(blocks => blocks.length ? blocks : existingBlocks.map(b => ({ ...b, items: [], totalTime: 0 })));
        }
        return;
      }
      
      console.log("No existing blocks found, creating first block");
      
      // Create the new block
      const novoBlocoInput = {
        telejornal_id: selectedJournal,
        nome: "Bloco 1",
        ordem: 1
      };
      
      const novoBloco = await createBloco(novoBlocoInput);
      console.log("First block created successfully:", novoBloco);
      
      // Immediately update the UI if setBlocks is provided
      if (setBlocks) {
        setBlocks([{ 
          ...novoBloco, 
          items: [],
          totalTime: 0
        }]);
      }
      
      // Force refresh the blocks query
      blocosQuery.refetch();
      
      return novoBloco;
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

  const handleAddBlock = async (blocks: (Bloco & { items: any[], totalTime: number })[]) => {
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

  const handleRenameBlock = async (blockId: string, newName: string, blocks: (Bloco & { items: any[], totalTime: number })[]) => {
    if (!currentTelejornal?.espelho_aberto) {
      toast({
        title: "Espelho fechado",
        description: "Você precisa abrir o espelho para renomear blocos.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await renameBloco(blockId, newName);
      
      // Update blocks state
      setBlocks(blocks.map(block => 
        block.id === blockId 
          ? { ...block, nome: newName } 
          : block
      ));
      
    } catch (error) {
      console.error("Erro ao renomear bloco:", error);
      toast({
        title: "Erro",
        description: "Não foi possível renomear o bloco",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteBlock = async (blockId: string, blocks: (Bloco & { items: any[], totalTime: number })[]) => {
    if (!currentTelejornal?.espelho_aberto) {
      toast({
        title: "Espelho fechado",
        description: "Você precisa abrir o espelho para excluir blocos.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await deleteBloco(blockId);
      
      // Update blocks state - remove the deleted block
      setBlocks(blocks.filter(block => block.id !== blockId));
      
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
    blockCreationAttempted,
    setBlockCreationAttempted,
    blockCreationInProgress,
    blocosQuery,
    handleAddFirstBlock,
    handleAddBlock,
    handleRenameBlock,
    handleDeleteBlock
  };
};

// Add React import at the top
import { useEffect } from 'react';
