
import { Materia } from "@/types";

/**
 * Formata o tempo em segundos para o formato MM:SS
 */
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Obtém a classe CSS para exibição de status
 */
export const getStatusClass = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'published': return 'bg-green-100 text-green-800';
    case 'draft': return 'bg-gray-100 text-gray-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'urgent': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Traduz o status para português
 */
export const translateStatus = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'published': return 'Publicado';
    case 'draft': return 'Rascunho';
    case 'pending': return 'Pendente';
    case 'urgent': return 'Urgente';
    default: return status || 'Rascunho';
  }
};

/**
 * Processa uma matéria atualizada para garantir formato consistente
 */
export const processUpdatedMateria = (materia: Materia): Materia => {
  return {
    ...materia,
    // Garante que duracao seja um número
    duracao: typeof materia.duracao === 'number' ? materia.duracao : 0,
    // Mapeia retranca para título para consistência da UI
    titulo: materia.retranca || "Sem título"
  };
};

/**
 * Calcula o tempo total do bloco a partir de seus itens
 */
export const calculateBlockTotalTime = (items: Materia[]): number => {
  return items.reduce((sum, item) => {
    const duration = typeof item.duracao === 'number' ? item.duracao : 0;
    return sum + duration;
  }, 0);
};
