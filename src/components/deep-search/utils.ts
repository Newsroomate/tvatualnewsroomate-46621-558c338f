
import { DeepSearchResult } from "@/services/deep-search-api";

// Converter resultado da busca para formato Materia padrão
export const convertSearchResultToMateria = (result: DeepSearchResult) => {
  return {
    id: result.id,
    titulo: result.retranca, // Map retranca to titulo to satisfy the interface
    retranca: result.retranca,
    clip: result.clip || '',
    duracao: 0, // Não temos duração no resultado da busca
    texto: result.texto || '',
    cabeca: result.cabeca || '',
    gc: result.gc || '',
    reporter: result.reporter || '',
    status: 'draft',
    pagina: '',
    tipo_material: '',
    bloco_id: '', // Será definido ao colar
    ordem: 0,
    created_at: result.created_at,
    updated_at: result.updated_at,
    tags: [],
    local_gravacao: '',
    equipamento: '',
    is_from_snapshot: true // Marca como vinda do histórico
  };
};
