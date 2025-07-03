
import { supabase } from "@/integrations/supabase/client";

export interface DeepSearchFilters {
  query: string;
  fields: string[];
  startDate?: Date;
  endDate?: Date;
  telejornalIds?: string[];
  status?: string[];
}

export interface DeepSearchResult {
  id: string;
  retranca: string;
  clip?: string;
  texto?: string;
  cabeca?: string;
  gc?: string;
  reporter?: string;
  telejornal_nome: string;
  bloco_nome: string;
  created_at: string;
  updated_at: string;
  highlight_field?: string;
  highlight_text?: string;
  source: 'materias' | 'snapshots'; // Para identificar a origem
}

export const performDeepSearch = async (filters: DeepSearchFilters): Promise<DeepSearchResult[]> => {
  console.log("Performing deep search with filters:", filters);
  
  const searchQuery = filters.query.toLowerCase().trim();
  
  // Construir condições de busca
  const buildSearchConditions = (searchQuery: string, fields: string[]): string[] => {
    const conditions: string[] = [];
    if (searchQuery) {
      if (fields.includes('retranca')) {
        conditions.push(`retranca.ilike.%${searchQuery}%`);
      }
      if (fields.includes('clip')) {
        conditions.push(`clip.ilike.%${searchQuery}%`);
      }
      if (fields.includes('texto')) {
        conditions.push(`texto.ilike.%${searchQuery}%`);
      }
      if (fields.includes('cabeca')) {
        conditions.push(`cabeca.ilike.%${searchQuery}%`);
      }
      if (fields.includes('gc')) {
        conditions.push(`gc.ilike.%${searchQuery}%`);
      }
      if (fields.includes('reporter')) {
        conditions.push(`reporter.ilike.%${searchQuery}%`);
      }
    }
    return conditions;
  };

  const searchConditions = buildSearchConditions(searchQuery, filters.fields);

  // Buscar na tabela materias (matérias ativas)
  let materiasQuery = supabase
    .from('materias')
    .select(`
      id,
      retranca,
      clip,
      texto,
      cabeca,
      gc,
      reporter,
      created_at,
      updated_at,
      blocos:bloco_id (
        nome,
        telejornais:telejornal_id (
          nome
        )
      )
    `);

  // Buscar na tabela materias_snapshots (histórico de espelhos fechados)
  let snapshotsQuery = supabase
    .from('materias_snapshots')
    .select(`
      id,
      retranca,
      clip,
      texto,
      cabeca,
      gc,
      reporter,
      created_at,
      updated_at,
      bloco_nome
    `);

  // Aplicar filtros de data para ambas as consultas
  if (filters.startDate) {
    const startDateString = filters.startDate.toISOString().split('T')[0];
    materiasQuery = materiasQuery.gte('created_at', startDateString);
    snapshotsQuery = snapshotsQuery.gte('created_at', startDateString);
  }
  
  if (filters.endDate) {
    const endDateString = filters.endDate.toISOString().split('T')[0];
    materiasQuery = materiasQuery.lte('created_at', endDateString + 'T23:59:59');
    snapshotsQuery = snapshotsQuery.lte('created_at', endDateString + 'T23:59:59');
  }

  // Aplicar condições de busca com OR para ambas as consultas
  if (searchConditions.length > 0) {
    materiasQuery = materiasQuery.or(searchConditions.join(','));
    snapshotsQuery = snapshotsQuery.or(searchConditions.join(','));
  }

  // Aplicar filtros de telejornal
  if (filters.telejornalIds && filters.telejornalIds.length > 0) {
    materiasQuery = materiasQuery.in('blocos.telejornal_id', filters.telejornalIds);
    // Para snapshots, precisaremos filtrar depois pois não temos relação direta
  }

  // Ordenar e limitar ambas as consultas
  materiasQuery = materiasQuery.order('updated_at', { ascending: false }).limit(50);
  snapshotsQuery = snapshotsQuery.order('updated_at', { ascending: false }).limit(50);

  // Executar ambas as consultas
  const [materiasResult, snapshotsResult] = await Promise.all([
    materiasQuery,
    snapshotsQuery
  ]);

  if (materiasResult.error) {
    console.error("Error searching materias:", materiasResult.error);
    throw materiasResult.error;
  }

  if (snapshotsResult.error) {
    console.error("Error searching snapshots:", snapshotsResult.error);
    throw snapshotsResult.error;
  }

  // Processar resultados das matérias ativas
  const materiasProcessed = (materiasResult.data || []).map((item: any) => {
    let highlightField = '';
    let highlightText = '';
    
    // Determinar qual campo contém a correspondência
    if (searchQuery) {
      const fieldsToCheck = [
        { field: 'retranca', value: item.retranca },
        { field: 'clip', value: item.clip },
        { field: 'texto', value: item.texto },
        { field: 'cabeca', value: item.cabeca },
        { field: 'gc', value: item.gc },
        { field: 'reporter', value: item.reporter }
      ];
      
      for (const fieldCheck of fieldsToCheck) {
        if (fieldCheck.value && fieldCheck.value.toLowerCase().includes(searchQuery) && 
            filters.fields.includes(fieldCheck.field)) {
          highlightField = fieldCheck.field;
          // Extrair contexto ao redor da palavra encontrada
          const text = fieldCheck.value;
          const index = text.toLowerCase().indexOf(searchQuery);
          const start = Math.max(0, index - 50);
          const end = Math.min(text.length, index + searchQuery.length + 50);
          highlightText = text.substring(start, end);
          if (start > 0) highlightText = '...' + highlightText;
          if (end < text.length) highlightText = highlightText + '...';
          break;
        }
      }
    }

    return {
      id: item.id,
      retranca: item.retranca,
      clip: item.clip,
      texto: item.texto,
      cabeca: item.cabeca,
      gc: item.gc,
      reporter: item.reporter,
      telejornal_nome: item.blocos?.telejornais?.nome || 'N/A',
      bloco_nome: item.blocos?.nome || 'N/A',
      created_at: item.created_at,
      updated_at: item.updated_at,
      highlight_field: highlightField,
      highlight_text: highlightText,
      source: 'materias' as const
    };
  });

  // Processar resultados dos snapshots
  const snapshotsProcessed = (snapshotsResult.data || []).map((item: any) => {
    let highlightField = '';
    let highlightText = '';
    
    // Determinar qual campo contém a correspondência
    if (searchQuery) {
      const fieldsToCheck = [
        { field: 'retranca', value: item.retranca },
        { field: 'clip', value: item.clip },
        { field: 'texto', value: item.texto },
        { field: 'cabeca', value: item.cabeca },
        { field: 'gc', value: item.gc },
        { field: 'reporter', value: item.reporter }
      ];
      
      for (const fieldCheck of fieldsToCheck) {
        if (fieldCheck.value && fieldCheck.value.toLowerCase().includes(searchQuery) && 
            filters.fields.includes(fieldCheck.field)) {
          highlightField = fieldCheck.field;
          // Extrair contexto ao redor da palavra encontrada
          const text = fieldCheck.value;
          const index = text.toLowerCase().indexOf(searchQuery);
          const start = Math.max(0, index - 50);
          const end = Math.min(text.length, index + searchQuery.length + 50);
          highlightText = text.substring(start, end);
          if (start > 0) highlightText = '...' + highlightText;
          if (end < text.length) highlightText = highlightText + '...';
          break;
        }
      }
    }

    return {
      id: item.id,
      retranca: item.retranca,
      clip: item.clip,
      texto: item.texto,
      cabeca: item.cabeca,
      gc: item.gc,
      reporter: item.reporter,
      telejornal_nome: 'Histórico', // Para snapshots, indicamos que é do histórico
      bloco_nome: item.bloco_nome || 'N/A',
      created_at: item.created_at,
      updated_at: item.updated_at,
      highlight_field: highlightField,
      highlight_text: highlightText,
      source: 'snapshots' as const
    };
  });

  // Combinar os resultados e ordenar por data de atualização
  const allResults = [...materiasProcessed, ...snapshotsProcessed];
  
  // Aplicar filtro de telejornal nos snapshots se necessário
  let filteredResults = allResults;
  if (filters.telejornalIds && filters.telejornalIds.length > 0) {
    // Para snapshots, não podemos filtrar por telejornal facilmente, então mantemos todos
    // Isso pode ser melhorado no futuro adicionando informações de telejornal aos snapshots
    filteredResults = allResults;
  }

  // Ordenar todos os resultados por data de atualização (mais recentes primeiro)
  filteredResults.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  // Limitar o total de resultados
  const finalResults = filteredResults.slice(0, 100);

  console.log(`Deep search completed. Found ${finalResults.length} results (${materiasProcessed.length} from materias, ${snapshotsProcessed.length} from snapshots).`);
  return finalResults;
};
