
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

interface CopiedBlock {
  id: string;
  nome: string;
  ordem: number;
  materias: Materia[];
  is_copied_block: true;
}

interface ExtendedUsePasteMateriaProps extends UsePasteMateriaProps {
  copiedBlock?: CopiedBlock | null;
}

export const usePasteMateria = ({
  blocks,
  setBlocks,
  selectedMateria,
  copiedMateria,
  clearClipboard,
  markOptimisticUpdate,
  copiedBlock
}: ExtendedUsePasteMateriaProps) => {
  
  const pasteMateria = async () => {
    console.log('🚀 Iniciando processo de colar matéria');
    
    // Validação com suporte para blocos
    if (!validatePasteOperation(copiedMateria, blocks, copiedBlock)) {
      return;
    }

    console.log('📋 Colando matéria do histórico:', {
      materiaCopiada: {
        id: copiedMateria!.id,
        retranca: copiedMateria!.retranca,
        totalCampos: Object.keys(copiedMateria!).length,
        isFromSnapshot: copiedMateria!.is_from_snapshot
      },
      selectedMateria: selectedMateria?.retranca,
      blocksCount: blocks.length
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

    console.log('📄 Dados da matéria preservados:', {
      dadosOriginais: Object.keys(copiedMateria!).length + ' campos',
      dadosPreservados: Object.keys(materiaData).length + ' campos',
      materiaData
    });

    // Gerar ID temporário para atualização otimista
    const tempId = `temp-${Date.now()}`;
    const tempMateria = createTempMateria(materiaData, tempId, copiedMateria!);

    // Atualização otimista
    console.log('⚡ Aplicando atualização otimista na posição:', insertPosition);
    
    if (markOptimisticUpdate) {
      markOptimisticUpdate(tempId);
    }
    
    setBlocks((currentBlocks: any[]) => 
      applyOptimisticUpdate(currentBlocks, targetBlockId, insertPosition, tempMateria)
    );

    const positionMessage = selectedMateria 
      ? `logo abaixo da matéria "${selectedMateria.retranca}"` 
      : "no final do bloco";

    const camposPreservados = Object.keys(materiaData).filter(key => 
      materiaData[key as keyof typeof materiaData] && 
      materiaData[key as keyof typeof materiaData] !== ''
    ).length;

    toast({
      title: "Matéria colada do histórico",
      description: `"${tempMateria.retranca}" foi colada ${positionMessage} na página ${nextPageNumber} com ${camposPreservados} campos preservados`,
    });

    try {
      console.log('💾 Criando matéria no banco de dados...');
      const newMateria = await createMateria(materiaData);
      console.log('✅ Matéria criada no banco:', newMateria);

      // Atualizar ordens no banco
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
          console.log('🔄 Atualizando ordens no banco:', ordersToUpdate);
          await updateMateriasOrdem(ordersToUpdate);
        }
      }

      // Substituir item temporário pela versão real
      setBlocks((currentBlocks: any[]) => 
        replaceTemporaryMateria(currentBlocks, targetBlockId, tempId, newMateria)
      );

      console.log('✅ Processo de colar matéria concluído com sucesso');

    } catch (error) {
      console.error('❌ Erro ao colar matéria:', error);
      
      // Reverter atualização otimista
      setBlocks((currentBlocks: any[]) => 
        revertOptimisticUpdate(currentBlocks, targetBlockId, tempId)
      );

      toast({
        title: "Erro ao colar",
        description: "Não foi possível colar a matéria. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return { pasteMateria };
};
