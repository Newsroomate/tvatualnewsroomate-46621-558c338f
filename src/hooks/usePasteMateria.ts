
import { Materia } from '@/types';
import { createMateria, updateMateriasOrdem } from '@/services/materias-api';
import { toast } from '@/hooks/use-toast';

interface UsePasteMateriaProps {
  blocks: any[];
  setBlocks: (updater: (blocks: any[]) => any[]) => void;
  selectedMateria: Materia | null;
  copiedMateria: Materia | null;
  clearClipboard: () => void;
}

export const usePasteMateria = ({
  blocks,
  setBlocks,
  selectedMateria,
  copiedMateria,
  clearClipboard
}: UsePasteMateriaProps) => {
  
  // Função para calcular o próximo número de página no bloco
  const getNextPageNumber = (blockItems: Materia[]): string => {
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

  // Função para recalcular ordens após inserção
  const recalculateOrders = (items: Materia[], insertPosition: number): Materia[] => {
    return items.map((item, index) => ({
      ...item,
      ordem: index
    }));
  };
  
  const pasteMateria = async () => {
    if (!copiedMateria) {
      toast({
        title: "Nenhuma matéria copiada",
        description: "Copie uma matéria primeiro usando Ctrl+C",
        variant: "destructive"
      });
      return;
    }

    let targetBlockId: string;
    let insertPosition: number;
    let targetBlock: any;

    if (selectedMateria) {
      // Se há uma matéria selecionada, colar logo abaixo dela
      targetBlock = blocks.find(block => 
        block.items.some((item: Materia) => item.id === selectedMateria.id)
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
        insertPosition = blocks[0]?.items.length || 0;
      }
    } else {
      // Se não há matéria selecionada, colar no final do primeiro bloco
      targetBlockId = blocks[0]?.id;
      targetBlock = blocks[0];
      insertPosition = blocks[0]?.items.length || 0;
    }

    if (!targetBlockId || !targetBlock) {
      toast({
        title: "Erro ao colar",
        description: "Nenhum bloco disponível para colar a matéria",
        variant: "destructive"
      });
      return;
    }

    const nextPageNumber = getNextPageNumber(targetBlock.items);

    // Criar dados para nova matéria
    const materiaData = {
      bloco_id: targetBlockId,
      ordem: insertPosition,
      retranca: `${copiedMateria.retranca} (Cópia)`,
      texto: copiedMateria.texto || '',
      duracao: copiedMateria.duracao || 0,
      tipo_material: copiedMateria.tipo_material || '',
      pagina: nextPageNumber,
      clip: copiedMateria.clip || '',
      reporter: copiedMateria.reporter || '',
      gc: copiedMateria.gc || '',
      cabeca: copiedMateria.cabeca || '',
      status: copiedMateria.status || 'draft'
    };

    // Gerar ID temporário para atualização otimista
    const tempId = `temp-${Date.now()}`;
    const tempMateria: Materia = {
      id: tempId,
      ...materiaData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 1. ATUALIZAÇÃO OTIMISTA - Atualizar UI imediatamente
    console.log('Iniciando atualização otimista para posição:', insertPosition);
    
    setBlocks((currentBlocks: any[]) => 
      currentBlocks.map(block => {
        if (block.id === targetBlockId) {
          const updatedItems = [...block.items];
          
          // Inserir na posição específica
          updatedItems.splice(insertPosition, 0, tempMateria);
          
          // Recalcular ordens de todos os itens
          const itemsWithNewOrders = recalculateOrders(updatedItems, insertPosition);
          
          // Recalcular tempo total
          const totalTime = itemsWithNewOrders.reduce((sum, item) => sum + (item.duracao || 0), 0);
          
          console.log('Bloco atualizado otimisticamente:', {
            blockId: block.id,
            itemCount: itemsWithNewOrders.length,
            insertedAt: insertPosition,
            totalTime
          });
          
          return {
            ...block,
            items: itemsWithNewOrders,
            totalTime
          };
        }
        return block;
      })
    );

    const positionMessage = selectedMateria 
      ? `logo abaixo da matéria "${selectedMateria.retranca}"` 
      : "no final do bloco";

    // Mostrar toast de sucesso imediatamente
    toast({
      title: "Matéria colada",
      description: `"${tempMateria.retranca}" foi colada ${positionMessage} na página ${nextPageNumber}`,
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
          .slice(insertPosition) // Pegar apenas itens que vêm depois da posição de inserção
          .map((item: Materia, index: number) => ({
            id: item.id,
            ordem: insertPosition + 1 + index, // Nova ordem: posição de inserção + 1 + índice
            retranca: item.retranca
          }));

        if (ordersToUpdate.length > 0) {
          console.log('Atualizando ordens no banco:', ordersToUpdate);
          await updateMateriasOrdem(ordersToUpdate);
        }
      }

      // 4. SUBSTITUIR ITEM TEMPORÁRIO PELA VERSÃO REAL DO BANCO
      setBlocks((currentBlocks: any[]) => 
        currentBlocks.map(block => {
          if (block.id === targetBlockId) {
            const updatedItems = block.items.map((item: Materia) => 
              item.id === tempId ? newMateria : item
            );
            
            const totalTime = updatedItems.reduce((sum, item) => sum + (item.duracao || 0), 0);
            
            console.log('Substituindo item temporário pela versão real do banco');
            
            return {
              ...block,
              items: updatedItems,
              totalTime
            };
          }
          return block;
        })
      );

    } catch (error) {
      console.error('Erro ao colar matéria:', error);
      
      // REVERTER ATUALIZAÇÃO OTIMISTA EM CASO DE ERRO
      setBlocks((currentBlocks: any[]) => 
        currentBlocks.map(block => {
          if (block.id === targetBlockId) {
            const updatedItems = block.items.filter((item: Materia) => item.id !== tempId);
            const totalTime = updatedItems.reduce((sum, item) => sum + (item.duracao || 0), 0);
            
            console.log('Revertendo atualização otimista devido ao erro');
            
            return {
              ...block,
              items: updatedItems,
              totalTime
            };
          }
          return block;
        })
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
