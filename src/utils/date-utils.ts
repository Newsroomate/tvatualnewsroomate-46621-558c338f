import { format as dateFnsFormat } from "date-fns";
import { ptBR } from "date-fns/locale";

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
        minute: '2-digit',
        hour12: false
      });
    case 'time':
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    default:
      return date.toLocaleDateString('pt-BR');
  }
};

/**
 * Formata uma data usando date-fns (mais confiável que toLocaleString)
 * @param dateString - String de data do banco de dados (UTC)
 * @param formatString - Formato desejado (ex: "dd/MM/yyyy HH:mm")
 * @returns Data formatada no timezone local
 */
export const formatDate = (dateString: string, formatString: string = "dd/MM/yyyy"): string => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    return dateFnsFormat(date, formatString, { locale: ptBR });
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return '-';
  }
};

/**
 * Formatos comuns pré-definidos
 */
export const DATE_FORMATS = {
  DATE_ONLY: "dd/MM/yyyy",
  DATE_TIME: "dd/MM/yyyy 'às' HH:mm",
  DATE_TIME_SECONDS: "dd/MM/yyyy 'às' HH:mm:ss",
  TIME_ONLY: "HH:mm",
  TIME_WITH_SECONDS: "HH:mm:ss",
  FULL: "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm"
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
