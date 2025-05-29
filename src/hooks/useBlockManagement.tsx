import { useState, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Bloco, Materia, Telejornal } from "@/types";
import { createBloco, updateBloco, deleteBloco } from "@/services/blocos-api";
import { createMateria } from "@/services/api";
import { useClipboard } from "@/context/ClipboardContext";
import { findHighestPageNumber } from "@/components/news-schedule/utils";

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
  const { copiedBlock, clearClipboard } = useClipboard();

  const handlePasteBlock = async () => {
    if (!selectedJournal || !currentTelejornal?.espelho_aberto || !copiedBlock) {
      toast({
        title: "Erro",
        description: "Não é possível colar o bloco. Verifique se o espelho está aberto e se há um bloco copiado.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Calculate the next order number for the new block
      const nextOrder = blocks.length + 1;
      
      // Create the new block
      const novoBlocoInput = {
        telejornal_id: selectedJournal,
        nome: copiedBlock.nome,
        ordem: nextOrder
      };
      
      const novoBloco = await createBloco(novoBlocoInput);
      console.log(`Pasted block created: ${novoBloco.nome} with order ${novoBloco.ordem}`);
      
      // Create all the materias for the new block
      const materiasToCreate = copiedBlock.materias.map((materia, index) => {
        const nextPage = (findHighestPageNumber(blocks) + index + 1).toString();
        
        return {
          bloco_id: novoBloco.id,
          pagina: nextPage,
          retranca: materia.retranca,
          clip: materia.clip || "",
          duracao: materia.duracao || 0,
          status: materia.status || "draft" as const,
          reporter: materia.reporter || "",
          ordem: index + 1,
          texto: materia.texto || "",
          cabeca: materia.cabeca || "",
          gc: materia.gc || "",
          tags: materia.tags || [],
          local_gravacao: materia.local_gravacao || "",
          equipamento: materia.equipamento || ""
        };
      });
      
      // Create all materias
      const createdMaterias = await Promise.all(
        materiasToCreate.map(materia => createMateria(materia))
      );
      
      // Calculate total time for the new block
      const totalTime = createdMaterias.reduce((sum, materia) => sum + materia.duracao, 0);
      
      // Update UI with the new block and its materias
      setBlocks([...blocks, { 
        ...novoBloco, 
        items: createdMaterias,
        totalTime
      }]);
      
      // Clear the clipboard after successful paste
      clearClipboard();
      
      toast({
        title: "Bloco colado com sucesso",
        description: `Bloco "${copiedBlock.nome}" com ${copiedBlock.materias.length} matérias foi adicionado ao final do espelho.`,
      });
      
      // Refresh the blocks query
      blocosQuery.refetch();
      
    } catch (error) {
      console.error("Erro ao colar bloco:", error);
      toast({
        title: "Erro",
        description: "Não foi possível colar o bloco",
        variant: "destructive"
      });
    }
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
      
      // Create the new block
      const novoBlocoInput = {
        telejornal_id: selectedJournal,
        nome: "Bloco 1",
        ordem: 1
      };
      
      const novoBloco = await createBloco(novoBlocoInput);
      console.log("First block created successfully:", novoBloco);
      
      // Immediately update the UI
      setBlocks([{ 
        ...novoBloco, 
        items: [],
        totalTime: 0
      }]);
      
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
    handleDeleteBlock,
    handlePasteBlock
  };
};
