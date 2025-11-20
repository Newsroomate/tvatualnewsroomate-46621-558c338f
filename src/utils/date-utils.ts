/**
 * Formata uma data do banco (UTC) para o timezone local brasileiro
 */
export const formatDatabaseDate = (dateString: string, format: 'date' | 'datetime' | 'time' = 'date'): string => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  
  switch (format) {
    case 'date':
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    case 'datetime':
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    case 'time':
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    default:
      return date.toLocaleDateString('pt-BR');
  }
};

/**
 * Obtém a data de referência no formato YYYY-MM-DD para o banco
 */
export const getReferenceDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
