
import { Materia } from '@/types';
import { createMateria, updateMateria } from '@/services/materias-api';
import { toast } from '@/hooks/use-toast';
import { useOrderCalculation } from './useOrderCalculation';
import { useRef } from 'react';

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
  const { calculateInsertOrder, normalizeOrders, getItemsToUpdate } = useOrderCalculation();
  const operationQueue = useRef<Set<string>>(new Set());
  
  // Função para calcular o próximo número de página no bloco
  const getNextPageNumber = (blockItems: Materia[]): string => {
    // Filtrar apenas as páginas que são números válidos
    const pageNumbers = blockItems
      .map(item => {
        const pageNum = parseInt(item.pagina || '0');
        return isNaN(pageNum) ? 0 : pageNum;
      })
      .filter(num => num > 0);
    
    // Se não há páginas numeradas, começar com 1
    if (pageNumbers.length === 0) {
      return '1';
    }
    
    // Encontrar o maior número e adicionar 1
    const maxPageNumber = Math.max(...pageNumbers);
    return (maxPageNumber + 1).toString();
  };

  // Função para atualizar ordens das matérias no banco de dados
  const updateMateriasOrders = async (materiasToUpdate: Materia[]) => {
    if (materiasToUpdate.length === 0) return;
    
    const updatePromises = materiasToUpdate.map(materia => 
      updateMateria(materia.id, { ordem: materia.ordem })
    );
    await Promise.all(updatePromises);
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

    if (!selectedMateria) {
      toast({
        title: "Nenhuma matéria selecionada",
        description: "Selecione uma matéria primeiro para colar abaixo dela",
        variant: "destructive"
      });
      return;
    }

    // Generate unique operation ID to prevent duplicate operations
    const operationId = `paste-${selectedMateria.id}-${Date.now()}`;
    
    if (operationQueue.current.has(operationId)) {
      console.log('Operation already in progress, skipping duplicate');
      return;
    }
    
    operationQueue.current.add(operationId);

    try {
      // Encontrar o bloco que contém a matéria selecionada
      const targetBlock = blocks.find(block => 
        block.items.some((item: Materia) => item.id === selectedMateria.id)
      );
      
      if (!targetBlock) {
        toast({
          title: "Erro ao colar",
          description: "Não foi possível encontrar o bloco da matéria selecionada",
          variant: "destructive"
        });
        return;
      }

      const targetBlockId = targetBlock.id;
      
      // Calculate the new order for the inserted materia
      const newOrder = calculateInsertOrder(targetBlock.items, selectedMateria);
      
      // Calcular o próximo número de página
      const nextPageNumber = getNextPageNumber(targetBlock.items);

      // Criar dados para nova matéria
      const materiaData = {
        bloco_id: targetBlockId,
        ordem: newOrder,
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

      // Create temporary item for instant visual feedback
      const tempMateria = {
        ...materiaData,
        id: `temp-${operationId}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Update local state instantly
      setBlocks((currentBlocks: any[]) => 
        currentBlocks.map(block => {
          if (block.id === targetBlockId) {
            // Add temporary item to the correct position
            const updatedItems = [...block.items, tempMateria];
            
            // Normalize all orders to ensure proper sequence
            const normalizedItems = normalizeOrders(updatedItems);
            
            // Calculate total time
            const totalTime = normalizedItems.reduce((sum, item) => sum + (item.duracao || 0), 0);
            
            return {
              ...block,
              items: normalizedItems,
              totalTime
            };
          }
          return block;
        })
      );

      // Create the new materia in the database
      const newMateria = await createMateria(materiaData);

      // Get items that need order updates (those after the insertion point)
      const itemsToUpdate = getItemsToUpdate(
        targetBlock.items.filter(item => !item.id.toString().startsWith('temp-')), 
        newOrder
      ).map(item => ({
        ...item,
        ordem: (item.ordem || 0) + 1
      }));

      // Update orders in database if needed
      if (itemsToUpdate.length > 0) {
        await updateMateriasOrders(itemsToUpdate);
      }

      // Replace temporary item with real one and normalize all orders
      setBlocks((currentBlocks: any[]) => 
        currentBlocks.map(block => {
          if (block.id === targetBlockId) {
            // Remove temporary item and add real one
            const itemsWithoutTemp = block.items.filter(
              item => !item.id.toString().startsWith('temp-')
            );
            
            const updatedItems = [...itemsWithoutTemp, newMateria];
            
            // Normalize orders to ensure sequential integers
            const normalizedItems = normalizeOrders(updatedItems);
            
            // Calculate total time
            const totalTime = normalizedItems.reduce((sum, item) => sum + (item.duracao || 0), 0);
            
            return {
              ...block,
              items: normalizedItems,
              totalTime
            };
          }
          return block;
        })
      );

      toast({
        title: "Matéria colada",
        description: `"${newMateria.retranca}" foi colada abaixo da matéria selecionada na página ${nextPageNumber}`,
      });

    } catch (error) {
      console.error('Erro ao colar matéria:', error);
      
      // Remove temporary item on error
      setBlocks((currentBlocks: any[]) => 
        currentBlocks.map(block => ({
          ...block,
          items: block.items.filter(item => 
            !item.id.toString().startsWith('temp-') || 
            !item.id.toString().includes(operationId)
          )
        }))
      );
      
      toast({
        title: "Erro ao colar",
        description: "Não foi possível colar a matéria",
        variant: "destructive"
      });
    } finally {
      // Clean up operation queue
      setTimeout(() => {
        operationQueue.current.delete(operationId);
      }, 1000);
    }
  };

  return { pasteMateria };
};
