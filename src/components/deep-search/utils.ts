
import { DeepSearchResult } from "@/services/deep-search-api";

// Converter resultado da busca para formato Materia padrão
export const convertSearchResultToMateria = (result: DeepSearchResult) => {
  return {
    id: result.id,
    titulo: result.retranca, // Map retranca to titulo to satisfy the interface
    retranca: result.retranca,
    clip: result.clip || '',
    duracao: result.duracao || 0,
    texto: result.texto || '',
    cabeca: result.cabeca || '',
    gc: result.gc || '', // Using gc instead of lauda (database field)
    teleprompter: result.teleprompter || '',
    // observacoes field removed - doesn't exist in materias table (only in materias_snapshots)
    reporter: result.reporter || '',
    status: result.status || 'draft',
    pagina: result.pagina || '',
    tipo_material: result.tipo_material || '',
    tempo_clip: result.tempo_clip || '',
    local_gravacao: result.local_gravacao || '',
    bloco_id: '', // Será definido ao colar
    ordem: 0,
    created_at: result.created_at,
    updated_at: result.updated_at,
    tags: result.tags || [],
    is_from_snapshot: result.source === 'snapshots'
  };
};
