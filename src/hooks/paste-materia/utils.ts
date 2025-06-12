
import { Materia } from '@/types';

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

export const recalculateOrders = (items: Materia[], insertPosition: number): Materia[] => {
  return items.map((item, index) => ({
    ...item,
    ordem: index
  }));
};

export const createTempMateria = (materiaData: any, tempId: string, copiedMateria: Materia): Materia => {
  return {
    id: tempId,
    titulo: copiedMateria.retranca,
    descricao: copiedMateria.texto || '',
    tempo_estimado: copiedMateria.duracao || 0,
    apresentador: copiedMateria.reporter || '',
    link_vt: copiedMateria.clip || '',
    tags: copiedMateria.tags || [],
    horario_exibicao: copiedMateria.horario_exibicao,
    ...materiaData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};
