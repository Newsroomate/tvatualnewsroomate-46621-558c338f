
import { useState, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Bloco, Materia, Telejornal } from "@/types";
import { createBloco, updateBloco, deleteBloco } from "@/services/blocos-api";
import { createMateria } from "@/services/materias-api";
import { getLastBlockFromPreviousRundown } from "@/services/last-block-api";

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

  const createBlockWithLastBlockData = async (telejornalId: string, blockName: string, order: number) => {
    // Criar o bloco
    const novoBlocoInput = {
      telejornal_id: telejornalId,
      nome: blockName,
      ordem: order
    };
    
    const novoBloco = await createBloco(novoBlocoInput);
    console.log(`Block created: ${novoBloco.nome} with order ${novoBloco.ordem}`);

    // Buscar dados do último bloco do espelho anterior
    const lastBlockData = await getLastBlockFromPreviousRundown(telejornalId);
    
    let createdMaterias: Materia[] = [];
    let blockNameToUse = blockName;
    
    if (lastBlockData && lastBlockData.materias.length > 0) {
      console.log(`Carregando ${lastBlockData.materias.length} matérias do bloco anterior: ${lastBlockData.nome}`);
      
      // Usar o nome do último bloco
      blockNameToUse = lastBlockData.nome;
      
      // Atualizar o nome do bloco criado
      await updateBloco(novoBloco.id, { nome: blockNameToUse });
      
      // Criar as matérias do último bloco no novo bloco
      for (let i = 0; i < lastBlockData.materias.length; i++) {
        const materiaData = lastBlockData.materias[i];
        try {
          const newMateria = await createMateria({
            bloco_id: novoBloco.id,
            ordem: i + 1,
            retranca: materiaData.retranca || 'Sem título',
            clip: materiaData.clip || '',
            duracao: materiaData.duracao || 0,
            pagina: materiaData.pagina || '',
            reporter: materiaData.reporter || '',
            status: materiaData.status || 'draft',
            texto: materiaData.texto || '',
            cabeca: materiaData.cabeca || ''
          });
          
          createdMaterias.push({
            ...newMateria,
            titulo: newMateria.retranca || "Sem título"
          });
        } catch (error) {
          console.error('Erro ao criar matéria:', error);
        }
      }
      
      toast({
        title: "Bloco carregado",
        description: `Bloco "${blockNameToUse}" criado com ${createdMaterias.length} matérias do espelho anterior`,
        variant: "default"
      });
    }

    // Calcular tempo total
    const totalTime = createdMaterias.reduce((sum, item) => sum + (item.duracao || 0), 0);

    return {
      ...novoBloco,
      nome: blockNameToUse,
      items: createdMaterias,
      totalTime
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
      
      console.log("No existing blocks found, creating first block with previous rundown data");
      
      // Create the new block with data from previous rundown
      const newBlockWithData = await createBlockWithLastBlockData(selectedJournal, "Bloco 1", 1);
      
      console.log("First block created successfully with previous data:", newBlockWithData);
      
      // Immediately update the UI
      setBlocks([newBlockWithData]);
      
      // Force refresh the blocks query
      blocosQuery.refetch();
      
      return newBlockWithData;
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
