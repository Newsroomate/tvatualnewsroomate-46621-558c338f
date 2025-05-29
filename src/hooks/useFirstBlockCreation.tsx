
import { useState, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Bloco, Materia, Telejornal } from "@/types";
import { createBloco, updateBloco } from "@/services/blocos-api";
import { createMateria } from "@/services/materias-api";
import { getLastBlockFromPreviousRundown } from "@/services/last-block-api";

interface UseFirstBlockCreationProps {
  blocks: (Bloco & { items: Materia[], totalTime: number })[];
  setBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[], totalTime: number })[]>>;
  selectedJournal: string | null;
  currentTelejornal: Telejornal | null;
  blocosQuery: any;
}

export const useFirstBlockCreation = ({
  blocks,
  setBlocks,
  selectedJournal,
  currentTelejornal,
  blocosQuery
}: UseFirstBlockCreationProps) => {
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

    // SEMPRE buscar dados do último bloco do espelho anterior
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
    } else {
      console.log("Nenhum bloco anterior encontrado ou bloco anterior vazio");
      toast({
        title: "Bloco criado",
        description: `Bloco "${blockNameToUse}" criado (nenhum bloco anterior encontrado)`,
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
      
      // SEMPRE criar o novo bloco com dados do espelho anterior
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

  return {
    isCreatingFirstBlock,
    setIsCreatingFirstBlock,
    blockCreationInProgress,
    handleAddFirstBlock
  };
};
