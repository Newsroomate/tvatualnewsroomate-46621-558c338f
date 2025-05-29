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
    console.log(`Criando bloco "${blockName}" com dados do espelho anterior para telejornal: ${telejornalId}`);
    
    // Criar o bloco
    const novoBlocoInput = {
      telejornal_id: telejornalId,
      nome: blockName,
      ordem: order
    };
    
    const novoBloco = await createBloco(novoBlocoInput);
    console.log(`Bloco criado: ${novoBloco.nome} com ordem ${novoBloco.ordem}`);

    // Buscar dados do último bloco do espelho anterior deste telejornal específico
    const lastBlockData = await getLastBlockFromPreviousRundown(telejornalId);
    
    let createdMaterias: Materia[] = [];
    
    if (lastBlockData && lastBlockData.materias.length > 0) {
      console.log(`Carregando ${lastBlockData.materias.length} matérias do bloco anterior: ${lastBlockData.nome}`);
      
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
        title: "Espelho aberto",
        description: `Novo espelho criado com o bloco "${lastBlockData.nome}" (${createdMaterias.length} matérias) do espelho anterior`,
        variant: "default"
      });
    } else {
      console.log('Nenhum bloco anterior encontrado, criando bloco vazio');
      toast({
        title: "Espelho aberto",
        description: `Novo espelho de "${currentTelejornal?.nome}" criado com bloco inicial`,
        variant: "default"
      });
    }

    // Calcular tempo total
    const totalTime = createdMaterias.reduce((sum, item) => sum + (item.duracao || 0), 0);

    return {
      ...novoBloco,
      items: createdMaterias,
      totalTime
    };
  };

  const handleAddFirstBlock = async () => {
    if (!selectedJournal || !currentTelejornal?.espelho_aberto || blockCreationInProgress.current) {
      console.log("Cannot create first block - conditions not met");
      return;
    }
    
    try {
      blockCreationInProgress.current = true;
      setIsCreatingFirstBlock(true);
      
      // Verificar se já existem blocos
      const existingBlocks = await blocosQuery.refetch();
      
      console.log(`Verificando blocos existentes para telejornal ${selectedJournal}:`, existingBlocks.data);
      
      // Se blocos já existem, apenas atualizar o estado
      if (existingBlocks && existingBlocks.data && existingBlocks.data.length > 0) {
        console.log("Blocos já existem para este jornal, carregando dados existentes");
        return;
      }
      
      console.log("Nenhum bloco existente encontrado, criando primeiro bloco com dados do espelho anterior");
      
      // Criar o novo bloco com dados do espelho anterior
      const newBlockWithData = await createBlockWithLastBlockData(selectedJournal, "Bloco 1", 1);
      
      console.log("Primeiro bloco criado com sucesso:", newBlockWithData);
      
      // Atualizar a UI imediatamente
      setBlocks([newBlockWithData]);
      
      // Forçar refresh da query de blocos
      await blocosQuery.refetch();
      
      return newBlockWithData;
    } catch (error) {
      console.error("Erro ao adicionar bloco inicial:", error);
      
      // Se for erro de chave duplicada, tentar buscar os blocos novamente
      if (error instanceof Error && error.message.includes("duplicate key value")) {
        console.log("Erro de duplicação detectado, buscando blocos novamente");
        await blocosQuery.refetch();
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível criar o bloco inicial",
          variant: "destructive"
        });
      }
      
      throw error;
    } finally {
      blockCreationInProgress.current = false;
      setIsCreatingFirstBlock(false);
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
