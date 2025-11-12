import { Materia } from '@/types';
import { createMateria, updateMateriasOrdem } from '@/services/materias-api';
import { toast } from '@/hooks/use-toast';
import { PasteOperationResult } from './types';
import { logPasteStart, logPasteSuccess, logPasteError } from './logger';

export const getNextPageNumber = (blockItems: Materia[]): string => {
  const pageNumbers = blockItems
    .map(item => {
      const pageNum = parseInt(item.pagina || '0');
      return isNaN(pageNum) ? 0 : pageNum;
    })
    .filter(num => num > 0);
  
  if (pageNumbers.length === 0) {
    return '1';
  }
  
  const maxPageNumber = Math.max(...pageNumbers);
  return (maxPageNumber + 1).toString();
};

export const determinePasteTarget = (selectedMateria: Materia | null, blocks: any[]) => {
  let targetBlockId: string;
  let insertPosition: number;
  let targetBlock: any;

  if (selectedMateria) {
    // Se há uma matéria selecionada, colar logo abaixo dela
    targetBlock = blocks.find(block => 
      block.items?.some((item: Materia) => item.id === selectedMateria.id)
    );
    
    if (targetBlock) {
      targetBlockId = targetBlock.id;
      const selectedIndex = targetBlock.items.findIndex(
        (item: Materia) => item.id === selectedMateria.id
      );
      insertPosition = selectedIndex + 1;
    } else {
      targetBlockId = blocks[0]?.id;
      targetBlock = blocks[0];
      insertPosition = blocks[0]?.items?.length || 0;
    }
  } else {
    // Se não há matéria selecionada, colar no final do primeiro bloco
    targetBlockId = blocks[0]?.id;
    targetBlock = blocks[0];
    insertPosition = blocks[0]?.items?.length || 0;
  }

  if (!targetBlockId || !targetBlock) {
    return null;
  }

  return {
    targetBlockId,
    targetBlock,
    insertPosition
  };
};

export const buildCompleteMateriaDat = (
  copiedMateria: Materia,
  targetBlockId: string,
  insertPosition: number,
  nextPageNumber: string
) => {
  return {
    bloco_id: targetBlockId,
    ordem: insertPosition + 1,
    retranca: `${copiedMateria.retranca} (Cópia)`,
    
    // Preservar todos os campos de conteúdo
    texto: copiedMateria.texto || '',
    duracao: copiedMateria.duracao || 0,
    cabeca: copiedMateria.cabeca || '',
    gc: copiedMateria.gc || '', // Using gc instead of lauda (database field)
    // Note: 'teleprompter' and 'observacoes' fields removed - don't exist in materias table (only in materias_snapshots)
    // Note: 'lauda' field also removed - use 'gc' instead (actual database field)
    
    // Preservar campos de mídia
    clip: copiedMateria.clip || '',
    tempo_clip: copiedMateria.tempo_clip || '',
    
    // Preservar campos de pessoas e metadados
    reporter: copiedMateria.reporter || '',
    status: copiedMateria.status || 'draft',
    tipo_material: copiedMateria.tipo_material || '',
    
    // Preservar campos de produção
    local_gravacao: copiedMateria.local_gravacao || '',
    tags: copiedMateria.tags || [],
    
    // Página será a próxima disponível no bloco
    pagina: nextPageNumber
  };
};

export const executeMateriaImpast = async (
  copiedMateria: Materia,
  blocks: any[],
  setBlocks: (updater: (blocks: any[]) => any[]) => void,
  selectedMateria: Materia | null,
  markOptimisticUpdate?: (materiaId: string) => void
): Promise<PasteOperationResult> => {
  try {
    const pasteTarget = determinePasteTarget(selectedMateria, blocks);
    if (!pasteTarget) {
      logPasteError('materia', new Error('Nenhum bloco disponível'));
      return {
        success: false,
        message: "Nenhum bloco disponível para colar a matéria"
      };
    }

    const { targetBlockId, targetBlock, insertPosition } = pasteTarget;
    const nextPageNumber = getNextPageNumber(targetBlock.items || []);

    logPasteStart('materia', {
      targetBlockId,
      insertPosition,
      targetBlock: { id: targetBlock.id, nome: targetBlock.nome },
      nextPageNumber,
      copiedRetranca: copiedMateria.retranca
    });

    const materiaData = buildCompleteMateriaDat(
      copiedMateria,
      targetBlockId,
      insertPosition,
      nextPageNumber
    );

    // Gerar ID temporário para atualização otimista
    const tempId = `temp-${Date.now()}`;
    
    // Marcar como atualização otimista
    if (markOptimisticUpdate) {
      markOptimisticUpdate(tempId);
    }

    // Atualização otimista da UI
    setBlocks((currentBlocks: any[]) => {
      return currentBlocks.map(block => {
        if (block.id === targetBlockId) {
          const newItems = [...(block.items || [])];
          const tempMateria = {
            ...materiaData,
            id: tempId,
            titulo: materiaData.retranca,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          newItems.splice(insertPosition, 0, tempMateria);
          
          // Recalcular ordens
          const updatedItems = newItems.map((item, index) => ({
            ...item,
            ordem: index + 1
          }));
          
          return {
            ...block,
            items: updatedItems,
            totalTime: updatedItems.reduce((sum, item) => sum + (item.duracao || 0), 0)
          };
        }
        return block;
      });
    });

    // Criar no banco de dados
    const newMateria = await createMateria(materiaData);

    // Atualizar ordens no banco se necessário
    const currentTargetBlock = blocks.find(b => b.id === targetBlockId);
    if (currentTargetBlock?.items) {
      const ordersToUpdate = currentTargetBlock.items
        .slice(insertPosition)
        .map((item: Materia, index: number) => ({
          id: item.id,
          ordem: insertPosition + 2 + index, // +2 porque a nova matéria ocupa insertPosition + 1
          retranca: item.retranca
        }));

      if (ordersToUpdate.length > 0) {
        await updateMateriasOrdem(ordersToUpdate);
      }
    }

    // Substituir item temporário pela versão real
    setBlocks((currentBlocks: any[]) => {
      return currentBlocks.map(block => {
        if (block.id === targetBlockId) {
          const updatedItems = block.items.map((item: any) => 
            item.id === tempId ? newMateria : item
          );
          
          return {
            ...block,
            items: updatedItems,
            totalTime: updatedItems.reduce((sum: number, item: any) => sum + (item.duracao || 0), 0)
          };
        }
        return block;
      });
    });

    const positionMessage = selectedMateria 
      ? `logo abaixo da matéria "${selectedMateria.retranca}"` 
      : "no final do bloco";

    logPasteSuccess('materia', {
      materiaId: newMateria.id,
      retranca: newMateria.retranca,
      pagina: nextPageNumber,
      blocoNome: targetBlock.nome,
      posicao: insertPosition
    });

    return {
      success: true,
      message: `"${newMateria.retranca}" foi colada ${positionMessage} na página ${nextPageNumber}`
    };

  } catch (error) {
    console.error('Erro ao colar matéria:', error);
    logPasteError('materia', error);
    
    // Reverter UI em caso de erro
    setBlocks((currentBlocks: any[]) => {
      return currentBlocks.map(block => {
        return {
          ...block,
          items: (block.items || []).filter((item: any) => !item.id.startsWith('temp-')),
          totalTime: (block.items || [])
            .filter((item: any) => !item.id.startsWith('temp-'))
            .reduce((sum: number, item: any) => sum + (item.duracao || 0), 0)
        };
      });
    });

    return {
      success: false,
      message: "Não foi possível colar a matéria",
      error: error instanceof Error ? error.message : String(error)
    };
  }
};