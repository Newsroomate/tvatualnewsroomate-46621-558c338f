import { supabase } from "@/integrations/supabase/client";
import { GCTemplate, GCTemplateCampo, GCTemplateCategoria } from "@/types/gc-templates";

export const fetchGCTemplates = async (telejornalId?: string | null): Promise<GCTemplate[]> => {
  let q = supabase.from('gc_templates').select('*').order('nome', { ascending: true });
  if (telejornalId) {
    q = q.or(`telejornal_id.eq.${telejornalId},telejornal_id.is.null`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, campos: d.campos || [] })) as GCTemplate[];
};

export const createGCTemplate = async (input: {
  nome: string;
  categoria: GCTemplateCategoria;
  campos: GCTemplateCampo[];
  telejornal_id?: string | null;
}): Promise<GCTemplate> => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('gc_templates')
    .insert({
      nome: input.nome,
      categoria: input.categoria,
      campos: input.campos as any,
      telejornal_id: input.telejornal_id ?? null,
      created_by: user?.id ?? null,
    })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as GCTemplate;
};

export const updateGCTemplate = async (id: string, updates: Partial<GCTemplate>): Promise<void> => {
  const payload: any = { ...updates };
  if (payload.campos) payload.campos = payload.campos as any;
  const { error } = await supabase.from('gc_templates').update(payload).eq('id', id);
  if (error) throw error;
};

export const deleteGCTemplate = async (id: string): Promise<void> => {
  const { error } = await supabase.from('gc_templates').delete().eq('id', id);
  if (error) throw error;
};
