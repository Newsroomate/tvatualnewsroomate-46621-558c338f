
import { Materia } from '@/types';
import { recalculateOrders } from './utils';

export const applyOptimisticUpdate = (
  blocks: any[],
  targetBlockId: string,
  insertPosition: number,
  tempMateria: Materia
): any[] => {
  return blocks.map(block => {
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
  });
};

export const revertOptimisticUpdate = (
  blocks: any[],
  targetBlockId: string,
  tempId: string
): any[] => {
  return blocks.map(block => {
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
  });
};

export const replaceTemporaryMateria = (
  blocks: any[],
  targetBlockId: string,
  tempId: string,
  newMateria: Materia
): any[] => {
  return blocks.map(block => {
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
  });
};
