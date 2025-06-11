
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

      // Criar dados para nova matéria
      const materiaData = {
        bloco_id: targetBlockId,
        ordem: insertPosition,
        retranca: `${copiedMateria.retranca} (Cópia)`,
        texto: copiedMateria.texto || '',
        duracao: copiedMateria.duracao || 0,
        tipo_material: copiedMateria.tipo_material || '',
        pagina: nextPageNumber, // Usar o número de página calculado sequencialmente
        clip: copiedMateria.clip || '',
        reporter: copiedMateria.reporter || '',
        gc: copiedMateria.gc || '',
        cabeca: copiedMateria.cabeca || '',
        status: copiedMateria.status || 'draft'
      };

      // Criar a nova matéria
      const newMateria = await createMateria(materiaData);

      // Atualizar o estado local usando o padrão de updater function
      setBlocks((currentBlocks: any[]) => 
        currentBlocks.map(block => {
          if (block.id === targetBlockId) {
            const updatedItems = [...block.items];
            updatedItems.splice(insertPosition, 0, newMateria);
            
            // Recalcular o tempo total
            const totalTime = updatedItems.reduce((sum, item) => sum + (item.duracao || 0), 0);
            
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
        title: "Matéria colada",
        description: `"${newMateria.retranca}" foi colada abaixo da matéria selecionada na página ${nextPageNumber}`,
      });

    } catch (error) {
      console.error('Erro ao colar matéria:', error);
      toast({
        title: "Erro ao colar",
        description: "Não foi possível colar a matéria",
        variant: "destructive"
      });
    }
  };

  return { pasteMateria };
};
