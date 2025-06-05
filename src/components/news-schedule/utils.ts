
import { Bloco, Materia } from "@/types";

// Format time from seconds to MM:SS
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Parse clip time string to seconds
export const parseClipTime = (clipTime: string): number => {
  if (!clipTime || clipTime.trim() === '') return 0;
  
  // Handle different formats: "MM:SS", "M:SS", "SS"
  const parts = clipTime.split(':');
  
  if (parts.length === 1) {
    // Only seconds
    return parseInt(parts[0]) || 0;
  } else if (parts.length === 2) {
    // Minutes:Seconds
    const minutes = parseInt(parts[0]) || 0;
    const seconds = parseInt(parts[1]) || 0;
    return (minutes * 60) + seconds;
  }
  
  return 0;
};

// Helper to calculate total time for a block including clip times
export const calculateBlockTotalTime = (items: Materia[]): number => {
  return items.reduce((sum, item) => {
    const materiaDuration = item.duracao || 0;
    const clipDuration = parseClipTime(item.tempo_clip || '');
    return sum + materiaDuration + clipDuration;
  }, 0);
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

// Tradução do status para português
export const translateStatus = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'published': return 'Publicado';
    case 'draft': return 'Rascunho';
    case 'pending': return 'Pendente';
    case 'urgent': return 'Urgente';
    default: return status || 'Rascunho';
  }
};

// Process updated materia for UI updates - this is used in the realtime subscription handlers
export const processUpdatedMateria = (updatedMateria: Materia): Materia => {
  console.log('Processing materia update for UI:', updatedMateria);
  return {
    ...updatedMateria,
    // Make sure we have a titulo property for UI consistency
    titulo: updatedMateria.retranca || "Sem título" 
  };
};
