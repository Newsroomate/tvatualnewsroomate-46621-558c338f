
import { Materia } from '@/types';
import { createMateria } from '@/services/materias-api';
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

  // Função para recalcular ordens das matérias após inserção
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

    if (!selectedMateria) {
      toast({
        title: "Nenhuma matéria selecionada",
        description: "Selecione uma matéria primeiro para colar abaixo dela",
        variant: "destructive"
      });
      return;
    }

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
      const selectedIndex = targetBlock.items.findIndex(
        (item: Materia) => item.id === selectedMateria.id
      );
      const insertPosition = selectedIndex + 1; // Sempre colar logo abaixo da selecionada

      // Calcular o próximo número de página
      const nextPageNumber = getNextPageNumber(targetBlock.items || []);

      // Criar dados para nova matéria com ordem correta
      const materiaData = {
        bloco_id: targetBlockId,
        ordem: insertPosition, // Usar a posição de inserção como ordem
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

      // Primeiro, atualizar o estado local para ter feedback visual instantâneo
      setBlocks((currentBlocks: any[]) => 
        currentBlocks.map(block => {
          if (block.id === targetBlockId) {
            const updatedItems = [...block.items];
            
            // Criar uma matéria temporária para inserção visual
            const tempMateria = {
              ...materiaData,
              id: `temp-${Date.now()}`, // ID temporário
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            // Inserir na posição correta
            updatedItems.splice(insertPosition, 0, tempMateria);
            
            // Recalcular as ordens de todas as matérias após a inserção
            const reorderedItems = recalculateOrders(updatedItems, insertPosition);
            
            // Calcular o tempo total
            const totalTime = reorderedItems.reduce((sum, item) => sum + (item.duracao || 0), 0);
            
            return {
              ...block,
              items: reorderedItems,
              totalTime
            };
          }
          return block;
        })
      );

      // Criar a nova matéria no banco de dados
      const newMateria = await createMateria(materiaData);

      // Atualizar o estado novamente com a matéria real do banco de dados
      setBlocks((currentBlocks: any[]) => 
        currentBlocks.map(block => {
          if (block.id === targetBlockId) {
            // Remover a matéria temporária e inserir a real
            const itemsWithoutTemp = block.items.filter(item => !item.id.toString().startsWith('temp-'));
            const updatedItems = [...itemsWithoutTemp];
            
            // Inserir a matéria real na posição correta
            updatedItems.splice(insertPosition, 0, newMateria);
            
            // Recalcular as ordens
            const reorderedItems = recalculateOrders(updatedItems, insertPosition);
            
            // Calcular o tempo total
            const totalTime = reorderedItems.reduce((sum, item) => sum + (item.duracao || 0), 0);
            
            return {
              ...block,
              items: reorderedItems,
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
      
      // Reverter o estado local em caso de erro, removendo a matéria temporária
      setBlocks((currentBlocks: any[]) => 
        currentBlocks.map(block => ({
          ...block,
          items: block.items.filter(item => !item.id.toString().startsWith('temp-'))
        }))
      );
      
      toast({
        title: "Erro ao colar",
        description: "Não foi possível colar a matéria",
        variant: "destructive"
      });
    }
  };

  return { pasteMateria };
};
