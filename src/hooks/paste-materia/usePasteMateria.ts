
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
    // Validação inicial aprimorada
    if (!validatePasteOperation(copiedMateria, blocks)) {
      console.log('Validação falhou - tentativa de paste cancelada');
      return;
    }

    // Log detalhado para debugging
    console.log('=== INICIANDO PASTE DE MATÉRIA ===', {
      materiaCopiada: {
        id: copiedMateria!.id,
        retranca: copiedMateria!.retranca,
        timestamp: new Date().toLocaleTimeString()
      },
      selectedMateria: selectedMateria?.retranca || 'nenhuma',
      blocksCount: blocks.length,
      operationId: `paste_${Date.now()}`
    });

    // Determinar onde colar
    const pasteTarget = determinePasteTarget(selectedMateria, blocks);
    if (!pasteTarget) {
      toast({
        title: "❌ Erro ao colar",
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

    console.log('Dados preparados para criação:', {
      targetBlock: targetBlockId,
      position: insertPosition,
      page: nextPageNumber,
      camposPreservados: Object.keys(materiaData).length
    });

    // Gerar ID temporário para atualização otimista
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tempMateria = createTempMateria(materiaData, tempId, copiedMateria!);

    // 1. ATUALIZAÇÃO OTIMISTA - Atualizar UI imediatamente
    console.log('Aplicando atualização otimista:', { tempId, insertPosition });
    
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

    // Toast de sucesso imediato
    toast({
      title: "✅ Matéria colada do histórico",
      description: `"${tempMateria.retranca}" foi colada ${positionMessage} na página ${nextPageNumber}`,
    });

    try {
      // 2. CRIAR NO BANCO DE DADOS
      console.log('Criando matéria no banco...');
      const newMateria = await createMateria(materiaData);
      console.log('✅ Matéria criada no banco:', { id: newMateria.id, retranca: newMateria.retranca });

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
          console.log('Atualizando ordens:', ordersToUpdate.length + ' itens');
          await updateMateriasOrdem(ordersToUpdate);
        }
      }

      // 4. SUBSTITUIR ITEM TEMPORÁRIO PELA VERSÃO REAL
      setBlocks((currentBlocks: any[]) => 
        replaceTemporaryMateria(currentBlocks, targetBlockId, tempId, newMateria)
      );

      console.log('=== PASTE DE MATÉRIA CONCLUÍDO COM SUCESSO ===');

    } catch (error) {
      console.error('❌ Erro ao colar matéria:', error);
      
      // REVERTER ATUALIZAÇÃO OTIMISTA
      setBlocks((currentBlocks: any[]) => 
        revertOptimisticUpdate(currentBlocks, targetBlockId, tempId)
      );

      toast({
        title: "❌ Erro ao colar",
        description: "Não foi possível colar a matéria. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return { pasteMateria };
};
