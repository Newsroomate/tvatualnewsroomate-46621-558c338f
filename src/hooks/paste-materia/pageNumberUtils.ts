
import { Materia } from '@/types';

/**
 * Utility functions for handling page number calculations
 */
export const pageNumberUtils = {
  /**
   * Calculate the next page number in a block
   */
  getNextPageNumber: (blockItems: Materia[]): string => {
    // Filter apenas as páginas que são números válidos
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
  }
};
