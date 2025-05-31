
import { Materia, Bloco } from "@/types";

export const calculateNextPageNumber = (
  destBlocks: (Bloco & { items: Materia[], totalTime: number })[],
  currentPageNumber: string
): string => {
  // Find the highest page number in the destination journal
  const allDestItems = destBlocks.flatMap(block => block.items);
  const pageNumbers = allDestItems
    .map(item => parseInt(item.pagina || '0'))
    .filter(num => !isNaN(num));
  
  const maxPageNumber = pageNumbers.length > 0 ? Math.max(...pageNumbers) : 0;
  return (maxPageNumber + 1).toString();
};

export const shouldUpdatePageNumber = (
  sourceJournal: string,
  destJournal: string
): boolean => {
  return sourceJournal !== destJournal;
};
