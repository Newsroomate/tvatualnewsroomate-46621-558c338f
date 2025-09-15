import { fetchBlocosByTelejornal } from '@/services/api';
import { fetchMateriasByBloco } from '@/services/materias-api';

interface GeneralScheduleTarget {
  targetBlockId: string;
  insertPosition: number;
  nextPageNumber: string;
}

export const determineGeneralScheduleTarget = async (
  selectedJournal: string
): Promise<GeneralScheduleTarget | null> => {
  try {
    // Buscar blocos do telejornal selecionado
    const blocks = await fetchBlocosByTelejornal(selectedJournal);
    
    if (blocks.length === 0) {
      console.log('Nenhum bloco encontrado no telejornal de destino');
      return null;
    }

    // Usar o primeiro bloco como destino
    const targetBlock = blocks[0];
    
    // Buscar materias do bloco para determinar posição e próxima página
    const blockMaterias = await fetchMateriasByBloco(targetBlock.id);
    
    // Inserir no final do bloco
    const insertPosition = blockMaterias.length;
    
    // Calcular próxima página
    const pageNumbers = blockMaterias
      .map(item => {
        const pageNum = parseInt(item.pagina || '0');
        return isNaN(pageNum) ? 0 : pageNum;
      })
      .filter(num => num > 0);
    
    const nextPageNumber = pageNumbers.length === 0 
      ? '1' 
      : (Math.max(...pageNumbers) + 1).toString();

    console.log('Target determinado para cola do Espelho Geral:', {
      targetBlockId: targetBlock.id,
      blockName: targetBlock.nome,
      insertPosition,
      nextPageNumber
    });

    return {
      targetBlockId: targetBlock.id,
      insertPosition,
      nextPageNumber
    };

  } catch (error) {
    console.error('Erro ao determinar target para cola do Espelho Geral:', error);
    return null;
  }
};