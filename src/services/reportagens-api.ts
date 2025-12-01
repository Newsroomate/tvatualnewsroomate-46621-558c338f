import { supabase } from "@/integrations/supabase/client";
import { Reportagem, ReportagemCreateInput } from "@/types/reportagens";

export const fetchReportagensByTelejornal = async (telejornalId: string): Promise<Reportagem[]> => {
  const { data: links, error: linksError } = await supabase
    .from('reportagens_telejornal')
    .select('reportagem_id')
    .eq('telejornal_id', telejornalId);

  if (linksError) throw linksError;
  if (!links || links.length === 0) return [];

  const reportagemIds = links.map(l => l.reportagem_id);

  const { data, error } = await supabase
    .from('reportagens')
    .select('*')
    .in('id', reportagemIds)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createReportagem = async (
  reportagem: ReportagemCreateInput,
  telejornalId: string,
  userId: string
): Promise<Reportagem> => {
  const { data, error } = await supabase
    .from('reportagens')
    .insert({
      ...reportagem,
      user_id: userId
    })
    .select()
    .single();

  if (error) throw error;

  // Link to telejornal
  const { error: linkError } = await supabase
    .from('reportagens_telejornal')
    .insert({
      reportagem_id: data.id,
      telejornal_id: telejornalId
    });

  if (linkError) throw linkError;

  return data;
};

export const updateReportagem = async (
  id: string,
  updates: Partial<ReportagemCreateInput>
): Promise<Reportagem> => {
  const { data, error } = await supabase
    .from('reportagens')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteReportagem = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('reportagens')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};
