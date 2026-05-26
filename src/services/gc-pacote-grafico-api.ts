import { supabase } from "@/integrations/supabase/client";
import { GCType } from "@/types/gc";
import {
  DEFAULT_GC_LAYOUT,
  GC_TIPOS_ORDER,
  GcLayout,
  GcMediaType,
  GcPacoteGraficoEntry,
} from "@/types/gc-pacote-grafico";

const BUCKET = 'gc-backgrounds';

const detectMediaType = (file: File): GcMediaType => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(file.name)) return 'video';
  return null;
};

const fileExt = (file: File) => {
  const m = file.name.match(/\.([a-z0-9]+)$/i);
  return (m ? m[1] : 'bin').toLowerCase();
};

export const fetchPacoteGrafico = async (
  telejornalId: string | null
): Promise<GcPacoteGraficoEntry[]> => {
  let query = supabase.from('gc_pacote_grafico').select('*');
  query = telejornalId
    ? query.eq('telejornal_id', telejornalId)
    : query.is('telejornal_id', null);
  const { data, error } = await query;
  if (error) throw error;

  return GC_TIPOS_ORDER.map((tipo) => {
    const row = (data || []).find((r: any) => r.tipo === tipo);
    if (row) {
      return {
        id: row.id,
        telejornal_id: row.telejornal_id,
        tipo: tipo as GCType,
        media_url: row.media_url,
        media_type: row.media_type as GcMediaType,
        layout: (row.layout as unknown as GcLayout) || DEFAULT_GC_LAYOUT,
      };
    }
    return {
      id: null,
      telejornal_id: telejornalId,
      tipo,
      media_url: null,
      media_type: null,
      layout: DEFAULT_GC_LAYOUT,
    };
  });
};

export const upsertPacoteGraficoTipo = async (
  telejornalId: string | null,
  tipo: GCType,
  patch: Partial<Pick<GcPacoteGraficoEntry, 'media_url' | 'media_type' | 'layout'>>
): Promise<void> => {
  // Try update first
  let updateQuery = supabase.from('gc_pacote_grafico').update({
    ...patch,
    layout: patch.layout as any,
    updated_at: new Date().toISOString(),
  } as any).eq('tipo', tipo);
  updateQuery = telejornalId
    ? updateQuery.eq('telejornal_id', telejornalId)
    : updateQuery.is('telejornal_id', null);

  const { data: updated, error: updErr } = await updateQuery.select('id');
  if (updErr) throw updErr;
  if (updated && updated.length > 0) return;

  const { data: { user } } = await supabase.auth.getUser();
  const { error: insErr } = await supabase.from('gc_pacote_grafico').insert({
    telejornal_id: telejornalId,
    tipo,
    media_url: patch.media_url ?? null,
    media_type: patch.media_type ?? null,
    layout: (patch.layout ?? DEFAULT_GC_LAYOUT) as any,
    created_by: user?.id ?? null,
  } as any);
  if (insErr) throw insErr;
};

export const uploadGcBackground = async (
  telejornalId: string | null,
  tipo: GCType,
  file: File
): Promise<{ media_url: string; media_type: GcMediaType }> => {
  const mediaType = detectMediaType(file);
  if (!mediaType) throw new Error('Tipo de arquivo não suportado. Envie imagem ou vídeo (MP4, WebM, MOV).');
  if (file.size > 20 * 1024 * 1024) throw new Error('Arquivo excede 20 MB.');

  const folder = telejornalId ?? 'global';
  const path = `${folder}/${tipo}-${Date.now()}.${fileExt(file)}`;

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    cacheControl: '3600',
    contentType: file.type || undefined,
  });
  if (upErr) throw upErr;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { media_url: data.publicUrl, media_type: mediaType };
};

export const removeGcBackground = async (
  telejornalId: string | null,
  tipo: GCType
): Promise<void> => {
  await upsertPacoteGraficoTipo(telejornalId, tipo, { media_url: null, media_type: null });
};
