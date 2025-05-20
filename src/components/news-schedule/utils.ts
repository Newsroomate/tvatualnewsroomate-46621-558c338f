
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const findHighestPageNumber = (blocks: any[]): number => {
  let highestPage = 0;
  blocks.forEach(block => {
    block.items.forEach((item: any) => {
      const pageNum = parseInt(item.pagina);
      if (!isNaN(pageNum) && pageNum > highestPage) {
        highestPage = pageNum;
      }
    });
  });
  return highestPage;
};

// Role translation helper
export const translateRole = (role: string): string => {
  const roleMap: Record<string, string> = {
    'editor_chefe': 'Editor-chefe',
    'editor': 'Editor',
    'reporter': 'Repórter',
    'produtor': 'Produtor'
  };
  
  return roleMap[role] || role;
};

// Format date to Brazilian format
export const formatBrazilianDate = (date: Date): string => {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};
