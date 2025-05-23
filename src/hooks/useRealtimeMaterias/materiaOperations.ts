
import { Materia } from "@/types";
import { 
  BlockWithItems, 
  findBlockById, 
  updateBlockItems, 
  updateBlocks, 
  logger,
  findItemById
} from "./utils";
import { processUpdatedMateria, calculateBlockTotalTime } from "@/components/news-schedule/utils";
import { toast } from "@/hooks/use-toast";

export const createMateriaOperations = (
  setBlocks: React.Dispatch<React.SetStateAction<BlockWithItems[]>>
) => {
  // Manipula atualização de matéria (de tempo real)
  const handleMateriaUpdate = (updatedMateria: Materia) => {
    logger.info('Processing materia update for UI:', updatedMateria);
    
    // Otimiza atualizações de estado usando atualizações funcionais com renderização prioritária
    setBlocks(currentBlocks => {
      try {
        // Processa a matéria imediatamente para garantir um formato consistente
        const processedMateria = processUpdatedMateria(updatedMateria);
        
        // Encontra onde este item existe atualmente
        const { blockId: sourceBlockId } = findItemById(currentBlocks, updatedMateria.id);
        
        // Se não for encontrado, trate como um novo item
        if (!sourceBlockId) {
          logger.debug(`Item ${updatedMateria.id} not found in current blocks, adding as new`);
          return addNewMateriaToBlock(currentBlocks, processedMateria);
        }
        
        // Se o bloco_id mudou, esta é uma operação de movimentação entre blocos
        if (sourceBlockId !== updatedMateria.bloco_id) {
          logger.debug(`Item ${updatedMateria.id} moved blocks from ${sourceBlockId} to ${updatedMateria.bloco_id}`);
          return moveMateriaToNewBlock(currentBlocks, processedMateria, sourceBlockId);
        }
        
        // Caminho rápido para atualizações simples para melhorar a capacidade de resposta da interface do usuário
        logger.debug(`Updating item ${updatedMateria.id} in block ${sourceBlockId}`);
        return updateExistingMateria(currentBlocks, processedMateria);
      } catch (error) {
        logger.error('Error processing materia update:', error);
        // Retorna blocos inalterados em caso de erro para evitar quebra da interface do usuário
        return currentBlocks;
      }
    });
  };
  
  // Manipula inserção de nova matéria
  const handleMateriaInsert = (newMateria: Materia) => {
    logger.info('Processing materia insert:', newMateria);
    
    setBlocks(currentBlocks => {
      try {
        const processedMateria = processUpdatedMateria(newMateria);
        const updatedBlocks = addNewMateriaToBlock(currentBlocks, processedMateria);
        
        // Show a toast notification for new items
        toast({
          title: "Nova matéria adicionada",
          description: `${processedMateria.retranca || "Nova matéria"} foi adicionada ao espelho.`,
        });
        
        return updatedBlocks;
      } catch (error) {
        logger.error('Error processing materia insert:', error);
        return currentBlocks;
      }
    });
  };
  
  // Manipula exclusão de matéria
  const handleMateriaDelete = (deletedMateria: Materia) => {
    logger.info('Processing materia deletion:', deletedMateria);
    
    setBlocks(currentBlocks => {
      try {
        // Verifica se o item existe em algum bloco
        const { blockId } = findItemById(currentBlocks, deletedMateria.id);
        
        // Se não for encontrado em nenhum bloco, não há necessidade de atualizar
        if (!blockId) {
          logger.debug(`Item ${deletedMateria.id} not found for deletion`);
          return currentBlocks;
        }
        
        // Show a toast notification
        toast({
          title: "Matéria removida",
          description: `${deletedMateria.retranca || "Matéria"} foi removida do espelho.`,
        });
        
        // Remove o item do seu bloco
        return currentBlocks.map(block => {
          if (block.id === blockId) {
            const updatedItems = block.items.filter(item => item.id !== deletedMateria.id);
            return {
              ...block,
              items: updatedItems,
              totalTime: calculateBlockTotalTime(updatedItems)
            };
          }
          return block;
        });
      } catch (error) {
        logger.error('Error processing materia deletion:', error);
        return currentBlocks;
      }
    });
  };
  
  // Funções auxiliares para várias operações de matéria
  
  // Adiciona uma nova matéria ao seu bloco
  const addNewMateriaToBlock = (blocks: BlockWithItems[], materia: Materia): BlockWithItems[] => {
    try {
      // Encontra o bloco onde esta matéria deve ser adicionada
      const targetBlock = blocks.find(block => block.id === materia.bloco_id);
      
      // Se o bloco não for encontrado, nenhuma alteração é necessária
      if (!targetBlock) {
        logger.warn(`Block ${materia.bloco_id} not found for item ${materia.id}`);
        return blocks;
      }
      
      return blocks.map(block => {
        if (block.id === materia.bloco_id) {
          // Processa para garantir formato consistente
          const processedMateria = processUpdatedMateria(materia);
          
          // Verifica se o item já existe no bloco para evitar duplicatas
          const itemExists = block.items.some(item => item.id === processedMateria.id);
          if (itemExists) {
            // Se o item já existe, apenas atualize-o
            return {
              ...block,
              items: block.items.map(item => 
                item.id === processedMateria.id ? processedMateria : item
              ),
              totalTime: calculateBlockTotalTime(
                block.items.map(item => 
                  item.id === processedMateria.id ? processedMateria : item
                )
              )
            };
          }
          
          // Insere o item na posição correta com base em ordem
          const updatedItems = [...block.items];
          const insertIndex = updatedItems.findIndex(item => 
            (item.ordem || 0) > (materia.ordem || 0)
          );
          
          if (insertIndex === -1) {
            updatedItems.push(processedMateria);
          } else {
            updatedItems.splice(insertIndex, 0, processedMateria);
          }
          
          return updateBlockItems(block, updatedItems);
        }
        return block;
      });
    } catch (error) {
      logger.error('Error adding materia to block:', error);
      return blocks;
    }
  };
  
  // Move uma matéria de um bloco para outro com implementação melhorada
  const moveMateriaToNewBlock = (
    blocks: BlockWithItems[], 
    updatedMateria: Materia, 
    sourceBlockId: string
  ): BlockWithItems[] => {
    try {
      logger.info(`Item ${updatedMateria.id} moved from block ${sourceBlockId} to ${updatedMateria.bloco_id}`);
      
      // Certifique-se de que tanto os blocos de origem quanto de destino existem
      const sourceBlock = blocks.find(block => block.id === sourceBlockId);
      const destBlock = blocks.find(block => block.id === updatedMateria.bloco_id);
      
      if (!sourceBlock || !destBlock) {
        logger.warn(`Source or destination block not found for move operation`);
        return updateExistingMateria(blocks, updatedMateria);
      }
      
      // Show a toast notification
      toast({
        title: "Matéria movida",
        description: `${updatedMateria.retranca || "Matéria"} foi movida para outro bloco.`,
      });
      
      // Processa blocos de forma imutável
      return blocks.map(block => {
        // Remove do bloco de origem
        if (block.id === sourceBlockId) {
          const updatedItems = block.items.filter(item => item.id !== updatedMateria.id);
          return updateBlockItems(block, updatedItems);
        }
        
        // Adiciona ao bloco de destino
        if (block.id === updatedMateria.bloco_id) {
          const processedMateria = processUpdatedMateria(updatedMateria);
          
          // Encontra a posição correta com base em ordem
          const updatedItems = [...block.items];
          
          // Se não houver ordem ou a ordem for inválida, adicione ao final
          if (!processedMateria.ordem || processedMateria.ordem <= 0) {
            processedMateria.ordem = updatedItems.length + 1;
          }
          
          const insertIndex = updatedItems.findIndex(item => 
            (item.ordem || 0) > (processedMateria.ordem || 0)
          );
          
          if (insertIndex === -1) {
            updatedItems.push(processedMateria);
          } else {
            updatedItems.splice(insertIndex, 0, processedMateria);
          }
          
          return updateBlockItems(block, updatedItems);
        }
        
        return block;
      });
    } catch (error) {
      logger.error('Error moving materia between blocks:', error);
      return blocks; 
    }
  };
  
  // Atualiza uma matéria existente em seu bloco atual com eficiência aprimorada
  const updateExistingMateria = (
    blocks: BlockWithItems[], 
    updatedMateria: Materia
  ): BlockWithItems[] => {
    try {
      // Processa imediatamente a matéria para garantir consistência de formato
      const processedMateria = processUpdatedMateria(updatedMateria);
      
      // Encontra o bloco que contém esta matéria
      const blockId = updatedMateria.bloco_id;
      const blockWithItem = blocks.find(block => 
        block.id === blockId && block.items.some(item => item.id === updatedMateria.id)
      );
      
      // Se o bloco não for encontrado, tente encontrar o item em qualquer bloco
      if (!blockWithItem) {
        const { blockId: sourceBlockId } = findItemById(blocks, updatedMateria.id);
        
        if (sourceBlockId && sourceBlockId !== blockId) {
          // O item foi movido para um bloco diferente
          return moveMateriaToNewBlock(blocks, processedMateria, sourceBlockId);
        } else if (blockId) {
          // O item não foi encontrado, mas temos um bloco_id, então adicione-o
          return addNewMateriaToBlock(blocks, processedMateria);
        } else {
          // Não podemos processar esta atualização
          logger.warn(`Could not find block for item ${updatedMateria.id}`);
          return blocks;
        }
      }
      
      // Atualiza a matéria no bloco onde ela existe
      return blocks.map(block => {
        if (block.id === blockId) {
          const itemIndex = block.items.findIndex(item => item.id === updatedMateria.id);
          
          if (itemIndex >= 0) {
            const updatedItems = [...block.items];
            
            // Add a highlight effect by adding a special property
            const highlightedItem = {
              ...processedMateria,
              _highlight: true
            };
            
            updatedItems[itemIndex] = highlightedItem;
            
            // Add animation effect by removing highlight after a delay
            setTimeout(() => {
              setBlocks(currentBlocks => {
                return currentBlocks.map(currentBlock => {
                  if (currentBlock.id === blockId) {
                    const items = currentBlock.items.map(item => {
                      if (item.id === updatedMateria.id) {
                        // Remove highlight property
                        const { _highlight, ...rest } = item as any;
                        return rest;
                      }
                      return item;
                    });
                    
                    return {
                      ...currentBlock,
                      items
                    };
                  }
                  return currentBlock;
                });
              });
            }, 1500);
            
            return updateBlockItems(block, updatedItems);
          }
        }
        return block;
      });
    } catch (error) {
      logger.error('Error updating existing materia:', error);
      return blocks;
    }
  };
  
  return {
    handleMateriaUpdate,
    handleMateriaInsert,
    handleMateriaDelete,
    updateExistingMateria
  };
};
