
import { Materia, Bloco } from "@/types";

export const calculateNextPageNumber = (
  destBlocks: (Bloco & { items: Materia[], totalTime: number })[],
  currentPageNumber: string
): string => {
  console.log('Calculating next page number for destination journal');
  
  // Find the highest page number in the destination journal
  const allDestItems = destBlocks.flatMap(block => block.items);
  console.log(`Found ${allDestItems.length} items in destination journal`);
  
  const pageNumbers = allDestItems
    .map(item => {
      const pageNum = parseInt(item.pagina || '0');
      console.log(`Item "${item.retranca}" has page number: ${item.pagina} -> parsed: ${pageNum}`);
      return pageNum;
    })
    .filter(num => !isNaN(num) && num > 0); // Only valid positive numbers
  
  console.log('Valid page numbers found:', pageNumbers);
  
  const maxPageNumber = pageNumbers.length > 0 ? Math.max(...pageNumbers) : 0;
  const nextPageNumber = maxPageNumber + 1;
  
  console.log(`Max page number: ${maxPageNumber}, Next page number: ${nextPageNumber}`);
  
  return nextPageNumber.toString();
};

export const shouldUpdatePageNumber = (
  sourceJournal: string,
  destJournal: string
): boolean => {
  const shouldUpdate = sourceJournal !== destJournal;
  console.log(`Should update page number? ${shouldUpdate} (source: ${sourceJournal}, dest: ${destJournal})`);
  return shouldUpdate;
};
