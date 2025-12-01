import { supabase } from "@/integrations/supabase/client";
import { Pauta } from "@/types";

export const fetchPautasByTelejornal = async (telejornalId: string): Promise<Pauta[]> => {
  const { data: links, error: linksError } = await supabase
    .from('pautas_telejornal')
    .select('pauta_id')
    .eq('telejornal_id', telejornalId);

  if (linksError) throw linksError;
  if (!links || links.length === 0) return [];

  const pautaIds = links.map(l => l.pauta_id);

  const { data, error } = await supabase
    .from('pautas')
    .select('*')
    .in('id', pautaIds)
    .order('created_at', { ascending: false });

  if (error) throw error;
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
  const { error } = await supabase
    .from('pautas_telejornal')
    .insert({
      pauta_id: pautaId,
      telejornal_id: telejornalId
    });

  if (error) throw error;
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
