
export const useDurationCalculator = () => {
  const calculateDuration = (retranca: string, cabeca: string, texto: string) => {
    // Count words in each field
    const countWords = (text: string) => {
      return text ? text.trim().split(/\s+/).filter(word => word.length > 0).length : 0;
    };

    const retrancaWords = countWords(retranca);
    const cabecaWords = countWords(cabeca);
    const textoWords = countWords(texto);
    
    const totalWords = retrancaWords + cabecaWords + textoWords;
    
    // Estimate reading speed: approximately 150 words per minute for TV news
    // This translates to 2.5 words per second
    const wordsPerSecond = 2.5;
    const estimatedDuration = Math.round(totalWords / wordsPerSecond);
    
    return estimatedDuration > 0 ? estimatedDuration : 0;
  };

  const getTotalWords = (retranca: string, cabeca: string, texto: string) => {
    const countWords = (text: string) => {
      return text ? text.trim().split(/\s+/).filter(word => word.length > 0).length : 0;
    };

    return countWords(retranca) + countWords(cabeca) + countWords(texto);
  };

  return { calculateDuration, getTotalWords };
};
