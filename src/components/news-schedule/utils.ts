
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
