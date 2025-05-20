
import { Bloco, Materia } from "@/types";

// Format time from seconds to MM:SS
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Find the highest page number across all blocks
export const findHighestPageNumber = (blocks: (Bloco & { items: Materia[] })[]): number => {
  let highestPage = 0;
  blocks.forEach(block => {
    block.items.forEach(item => {
      const pageNum = parseInt(item.pagina || '0');
      if (!isNaN(pageNum) && pageNum > highestPage) {
        highestPage = pageNum;
      }
    });
  });
  return highestPage;
};

// Get status color class
export const getStatusClass = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'published': return 'bg-green-100 text-green-800';
    case 'draft': return 'bg-gray-100 text-gray-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'urgent': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};
