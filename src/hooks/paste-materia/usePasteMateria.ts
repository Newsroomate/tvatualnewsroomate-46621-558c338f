import { Materia } from '@/types';
import { createMateria, updateMateriasOrdem } from '@/services/materias-api';
import { toast } from '@/hooks/use-toast';
import { UsePasteMateriaProps } from './types';
import { validatePasteOperation } from './validation';
import { determinePasteTarget } from './targeting';
import { getNextPageNumber, createTempMateria } from './utils';
import { buildPasteMateriaData } from './dataBuilder';
import { 
  applyOptimisticUpdate, 
  revertOptimisticUpdate, 
  replaceTemporaryMateria 
} from './optimisticUpdate';

export const usePasteMateria = ({
  blocks,
  setBlocks,
  selectedMateria,
  copiedMateria,
  clearClipboard,
  markOptimisticUpdate
}: UsePasteMateriaProps) => {
  
  const pasteMateria = async () => {
    // Validation with enhanced logging
    if (!validatePasteOperation(copiedMateria, blocks)) {
      console.log('Paste validation failed:', { copiedMateria: !!copiedMateria, blocksCount: blocks.length });
      return;
    }

    console.log('Starting paste operation with enhanced validation:', {
      materiaCopiada: {
        id: copiedMateria!.id,
        retranca: copiedMateria!.retranca,
        totalCampos: Object.keys(copiedMateria!).length,
        isFromSnapshot: copiedMateria!.is_from_snapshot
      },
      selectedMateria: selectedMateria?.retranca,
      blocksCount: blocks.length,
      timestamp: new Date().toISOString()
    });

    // Determinar onde colar
    const pasteTarget = determinePasteTarget(selectedMateria, blocks);
    if (!pasteTarget) {
      toast({
        title: "Erro ao colar",
        description: "Nenhum bloco disponível para colar a matéria",
        variant: "destructive"
      });
      return;
    }

    const { targetBlockId, targetBlock, insertPosition } = pasteTarget;
    const nextPageNumber = getNextPageNumber(targetBlock.items);

    // Criar dados para nova matéria
    const materiaData = buildPasteMateriaData(
      copiedMateria!,
      targetBlockId,
      insertPosition,
      nextPageNumber
    );

    console.log('Dados da matéria a ser criada (preservando TODOS os campos do histórico):', {
      dadosOriginais: Object.keys(copiedMateria!).length + ' campos',
      dadosPreservados: Object.keys(materiaData).length + ' campos',
      materiaData
    });

    // Gerar ID temporário para atualização otimista
    const tempId = `temp-${Date.now()}`;
    const tempMateria = createTempMateria(materiaData, tempId, copiedMateria!);

    // 1. ATUALIZAÇÃO OTIMISTA - Atualizar UI imediatamente
    console.log('Iniciando atualização otimista para posição:', insertPosition);
    
    // Marcar como atualização otimista para evitar duplicação realtime
    if (markOptimisticUpdate) {
      markOptimisticUpdate(tempId);
    }
    
    setBlocks((currentBlocks: any[]) => 
      applyOptimisticUpdate(currentBlocks, targetBlockId, insertPosition, tempMateria)
    );

    const positionMessage = selectedMateria 
      ? `logo abaixo da matéria "${selectedMateria.retranca}"` 
      : "no final do bloco";

    // Mostrar toast de sucesso imediatamente
    const camposPreservados = Object.keys(materiaData).filter(key => 
      materiaData[key as keyof typeof materiaData] && 
      materiaData[key as keyof typeof materiaData] !== ''
    ).length;

    toast({
      title: "Matéria colada do histórico",
      description: `"${tempMateria.retranca}" foi colada ${positionMessage} na página ${nextPageNumber} com ${camposPreservados} campos preservados`,
    });

    try {
      // 2. CRIAR NO BANCO DE DADOS
      console.log('Criando matéria no banco de dados...');
      const newMateria = await createMateria(materiaData);
      console.log('Matéria criada no banco:', newMateria);

      // 3. ATUALIZAR ORDENS NO BANCO
      const currentTargetBlock = blocks.find(b => b.id === targetBlockId);
      if (currentTargetBlock) {
        const ordersToUpdate = currentTargetBlock.items
          .slice(insertPosition)
          .map((item: Materia, index: number) => ({
            id: item.id,
            ordem: insertPosition + 1 + index,
            retranca: item.retranca
          }));

        if (ordersToUpdate.length > 0) {
          console.log('Atualizando ordens no banco:', ordersToUpdate);
          await updateMateriasOrdem(ordersToUpdate);
        }
      }

      // 4. SUBSTITUIR ITEM TEMPORÁRIO PELA VERSÃO REAL DO BANCO
      setBlocks((currentBlocks: any[]) => 
        replaceTemporaryMateria(currentBlocks, targetBlockId, tempId, newMateria)
      );

      // Clear clipboard after successful paste
      console.log('Paste operation completed successfully, clearing clipboard');
      setTimeout(() => {
        clearClipboard();
      }, 1000); // Delayed clear to prevent race conditions

    } catch (error) {
      console.error('Paste operation failed:', error);
      
      // REVERTER ATUALIZAÇÃO OTIMISTA EM CASO DE ERRO
      setBlocks((currentBlocks: any[]) => 
        revertOptimisticUpdate(currentBlocks, targetBlockId, tempId)
      );

      toast({
        title: "Erro ao colar",
        description: "Não foi possível colar a matéria. Tente novamente.",
        variant: "destructive"
      });

      // Don't clear clipboard on error so user can retry
      console.log('Clipboard preserved due to paste error');
    }
  };

  return { pasteMateria };
};
