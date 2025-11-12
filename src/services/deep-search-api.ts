
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
  lauda?: string;
  teleprompter?: string;
  // observacoes field removed - doesn't exist in materias table (only in materias_snapshots)
  reporter?: string;
  status?: string;
  pagina?: string;
  duracao?: number;
  tipo_material?: string;
  tempo_clip?: string;
  local_gravacao?: string;
  tags?: any;
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

  // Buscar na tabela espelhos_salvos (espelhos fechados)
  let espelhosQuery = supabase
    .from('espelhos_salvos')
    .select(`
      id,
      nome,
      estrutura,
      created_at,
      updated_at,
      data_referencia,
      telejornal_id
    `);

  // Aplicar filtros de data para ambas as consultas
  if (filters.startDate) {
    const startDateString = filters.startDate.toISOString().split('T')[0];
    materiasQuery = materiasQuery.gte('created_at', startDateString);
    espelhosQuery = espelhosQuery.gte('data_referencia', startDateString);
  }
  
  if (filters.endDate) {
    const endDateString = filters.endDate.toISOString().split('T')[0];
    materiasQuery = materiasQuery.lte('created_at', endDateString + 'T23:59:59');
    espelhosQuery = espelhosQuery.lte('data_referencia', endDateString);
  }

  // Aplicar condições de busca com OR para matérias (espelhos não suportam busca textual direta)
  if (searchConditions.length > 0) {
    materiasQuery = materiasQuery.or(searchConditions.join(','));
  }

  // Aplicar filtros de telejornal
  if (filters.telejornalIds && filters.telejornalIds.length > 0) {
    materiasQuery = materiasQuery.in('blocos.telejornal_id', filters.telejornalIds);
    espelhosQuery = espelhosQuery.in('telejornal_id', filters.telejornalIds);
  }

  // Ordenar e limitar ambas as consultas
  materiasQuery = materiasQuery.order('updated_at', { ascending: false }).limit(50);
  espelhosQuery = espelhosQuery.order('created_at', { ascending: false }).limit(50);

  // Executar ambas as consultas
  const [materiasResult, espelhosResult] = await Promise.all([
    materiasQuery,
    espelhosQuery
  ]);

  if (materiasResult.error) {
    console.error("Error searching materias:", materiasResult.error);
    throw materiasResult.error;
  }

  if (espelhosResult.error) {
    console.error("Error searching espelhos:", espelhosResult.error);
    throw espelhosResult.error;
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

  // Processar resultados dos espelhos fechados
  const espelhosProcessed: DeepSearchResult[] = [];
  
  if (espelhosResult.data && searchQuery) {
    for (const espelho of espelhosResult.data) {
      const estrutura = espelho.estrutura as any;
      
      // Extrair nome do telejornal do espelho
      const telejornalNome = estrutura?.telejornal?.nome || 
                            estrutura?.nome_telejornal ||
                            'Histórico';
      
      if (estrutura?.blocos) {
        for (const bloco of estrutura.blocos) {
          const items = bloco.items || bloco.materias || [];
          if (items.length > 0) {
            for (const item of items) {
              // Verificar se o item corresponde aos critérios de busca
              const shouldInclude = !searchQuery || filters.fields.some(field => {
                const value = item[field];
                return value && value.toLowerCase().includes(searchQuery);
              });
              
              if (shouldInclude) {
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
                
                espelhosProcessed.push({
                  id: item.id,
                  retranca: item.retranca || '',
                  clip: item.clip || '',
                  texto: item.texto || '',
                  cabeca: item.cabeca || '',
                  gc: item.gc || '',
                  reporter: item.reporter || '',
                  telejornal_nome: telejornalNome,
                  bloco_nome: bloco.nome || 'N/A',
                  created_at: espelho.created_at,
                  updated_at: espelho.updated_at || espelho.created_at,
                  highlight_field: highlightField,
                  highlight_text: highlightText,
                  source: 'snapshots' as const,
                  // Campos adicionais que podem existir nos espelhos salvos
                  // lauda field removed - using gc instead (database field)
                  teleprompter: item.teleprompter || '',
                  // observacoes field removed - doesn't exist in materias table (only in materias_snapshots)
                  status: item.status || 'draft',
                  pagina: item.pagina || '',
                  duracao: item.duracao || 0,
                  tipo_material: item.tipo_material || '',
                  tempo_clip: item.tempo_clip || '',
                  local_gravacao: item.local_gravacao || '',
                  tags: item.tags || []
                });
              }
            }
          }
        }
      }
    }
  }

  // Combinar os resultados e ordenar por data de atualização
  const allResults = [...materiasProcessed, ...espelhosProcessed];
  
  // Ordenar todos os resultados por data de atualização (mais recentes primeiro)
  allResults.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  // Limitar o total de resultados
  const finalResults = allResults.slice(0, 100);

  console.log(`Deep search completed. Found ${finalResults.length} results (${materiasProcessed.length} from materias, ${espelhosProcessed.length} from espelhos).`);
  
  if (finalResults.length === 0) {
    console.log("Nenhum resultado encontrado com os critérios de busca especificados");
  }
  
  return finalResults;
};
