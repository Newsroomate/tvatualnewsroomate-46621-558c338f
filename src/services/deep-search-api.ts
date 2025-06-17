
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
}

export const performDeepSearch = async (filters: DeepSearchFilters): Promise<DeepSearchResult[]> => {
  console.log("Performing deep search with filters:", filters);
  
  let query = supabase
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

  // Construir a condição de busca baseada nos campos selecionados
  const searchConditions: string[] = [];
  const searchQuery = filters.query.toLowerCase().trim();
  
  if (searchQuery) {
    if (filters.fields.includes('retranca')) {
      searchConditions.push(`retranca.ilike.%${searchQuery}%`);
    }
    if (filters.fields.includes('clip')) {
      searchConditions.push(`clip.ilike.%${searchQuery}%`);
    }
    if (filters.fields.includes('texto')) {
      searchConditions.push(`texto.ilike.%${searchQuery}%`);
    }
    if (filters.fields.includes('cabeca')) {
      searchConditions.push(`cabeca.ilike.%${searchQuery}%`);
    }
    if (filters.fields.includes('gc')) {
      searchConditions.push(`gc.ilike.%${searchQuery}%`);
    }
    if (filters.fields.includes('reporter')) {
      searchConditions.push(`reporter.ilike.%${searchQuery}%`);
    }
  }

  // Aplicar filtros de data
  if (filters.startDate) {
    const startDateString = filters.startDate.toISOString().split('T')[0];
    query = query.gte('created_at', startDateString);
  }
  
  if (filters.endDate) {
    const endDateString = filters.endDate.toISOString().split('T')[0];
    query = query.lte('created_at', endDateString + 'T23:59:59');
  }

  // Aplicar filtros de telejornal se especificado
  if (filters.telejornalIds && filters.telejornalIds.length > 0) {
    query = query.in('blocos.telejornal_id', filters.telejornalIds);
  }

  // Aplicar condições de busca com OR
  if (searchConditions.length > 0) {
    query = query.or(searchConditions.join(','));
  }

  // Ordenar por relevância (mais recentes primeiro)
  query = query.order('updated_at', { ascending: false });
  
  // Limitar resultados para performance
  query = query.limit(100);

  const { data, error } = await query;

  if (error) {
    console.error("Error performing deep search:", error);
    throw error;
  }

  // Processar resultados para incluir informações de highlight
  const results: DeepSearchResult[] = (data || []).map((item: any) => {
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
      highlight_text: highlightText
    };
  });

  console.log(`Deep search completed. Found ${results.length} results.`);
  return results;
};
