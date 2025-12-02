import { supabase } from "@/integrations/supabase/client";
import { Pauta } from "@/types";

export const fetchPautasByTelejornal = async (telejornalId: string): Promise<Pauta[]> => {
  console.log('[pautas-telejornal-api] Buscando pautas para telejornal:', telejornalId);
  
  const { data: links, error: linksError } = await supabase
    .from('pautas_telejornal')
    .select('pauta_id')
    .eq('telejornal_id', telejornalId);

  if (linksError) {
    console.error('[pautas-telejornal-api] Erro ao buscar links:', linksError);
    throw linksError;
  }
  
  console.log('[pautas-telejornal-api] Links encontrados:', links);
  
  if (!links || links.length === 0) {
    console.log('[pautas-telejornal-api] Nenhum link encontrado');
    return [];
  }

  const pautaIds = links.map(l => l.pauta_id);
  console.log('[pautas-telejornal-api] IDs de pautas:', pautaIds);

  const { data, error } = await supabase
    .from('pautas')
    .select('*')
    .in('id', pautaIds)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[pautas-telejornal-api] Erro ao buscar pautas:', error);
    throw error;
  }
  
  console.log('[pautas-telejornal-api] Pautas encontradas:', data);
  
  return (data || []).map((row: any) => ({
    id: row.id,
    titulo: row.titulo,
    descricao: row.descricao,
    data_cobertura: row.data_cobertura,
    local: row.local,
    horario: row.horario,
    entrevistado: row.entrevistado,
    produtor: row.produtor,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    proposta: row.proposta,
    encaminhamento: row.encaminhamento,
    informacoes: row.informacoes,
    programa: row.programa,
    reporter: row.reporter,
  })) as Pauta[];
};

export const linkPautaToTelejornal = async (pautaId: string, telejornalId: string): Promise<boolean> => {
  console.log('[pautas-telejornal-api] Vinculando pauta ao telejornal:', { pautaId, telejornalId });
  
  const { error } = await supabase
    .from('pautas_telejornal')
    .insert({
      pauta_id: pautaId,
      telejornal_id: telejornalId
    });

  if (error) {
    console.error('[pautas-telejornal-api] Erro ao vincular:', error);
    throw error;
  }
  
  console.log('[pautas-telejornal-api] Pauta vinculada com sucesso');
  return true;
};

export const unlinkPautaFromTelejornal = async (pautaId: string, telejornalId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('pautas_telejornal')
    .delete()
    .eq('pauta_id', pautaId)
    .eq('telejornal_id', telejornalId);

  if (error) throw error;
  return true;
};
