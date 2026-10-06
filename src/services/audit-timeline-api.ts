import { supabase } from "@/integrations/supabase/client";

export interface AuditEntry {
  id: string;
  materia_id: string;
  user_id: string;
  action: "create" | "update" | "delete" | string;
  created_at: string;
  telejornal_id: string | null;
  bloco_id: string | null;
  retranca: string | null;
  changed_fields: string[] | null;
  diff: Record<string, { old: unknown; new: unknown }> | null;
  snapshot: Record<string, any> | null;
  restored_at: string | null;
  user_name?: string;
}

export const FIELD_LABELS: Record<string, string> = {
  retranca: "Retranca", cabeca: "Cabeça", texto: "Texto", gc: "GC", gcs: "GCs",
  reporter: "Repórter", tipo_material: "Tipo de material", clip: "Clip", tempo_clip: "Tempo do clip",
  duracao: "Duração", pagina: "Página", status: "Status", editor: "Editor",
  local_gravacao: "Local", bloco_id: "Bloco", ordem: "Ordem",
  vmix_link_type: "Vínculo vMix", vmix_target: "Alvo vMix",
};

export const canViewAudit = async (): Promise<boolean> => {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return false;
  const { data, error } = await supabase.rpc("can_view_audit" as any, { _user_id: u.user.id });
  if (error) return false;
  return !!data;
};

export const fetchAuditTimeline = async (
  telejornalId: string,
  opts: { from: Date; to: Date; userId?: string; action?: string }
): Promise<AuditEntry[]> => {
  let q = supabase
    .from("materia_edit_history" as any)
    .select("*")
    .eq("telejornal_id", telejornalId)
    .gte("created_at", opts.from.toISOString())
    .lt("created_at", opts.to.toISOString())
    .order("created_at", { ascending: false })
    .limit(1000);
  if (opts.userId) q = q.eq("user_id", opts.userId);
  if (opts.action) q = q.eq("action", opts.action);
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data || []) as unknown as AuditEntry[];
  const ids = [...new Set(rows.map((r) => r.user_id))];
  if (ids.length) {
    const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", ids);
    const map = new Map(profiles?.map((p) => [p.id, p.full_name || "Usuário"]) || []);
    rows.forEach((r) => (r.user_name = map.get(r.user_id) || "Usuário"));
  }
  return rows;
};

/** Reverte um campo para o valor anterior registrado no diff. */
export const revertField = async (entry: AuditEntry, field: string) => {
  const oldValue = entry.diff?.[field]?.old ?? null;
  const { data, error } = await supabase
    .from("materias")
    .update({ [field]: oldValue } as any)
    .eq("id", entry.materia_id)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("A matéria não existe mais na grade (pode ter sido excluída).");
};

/** Restaura uma matéria excluída a partir do snapshot. */
export const restoreDeletedMateria = async (entry: AuditEntry) => {
  const snap = entry.snapshot;
  if (!snap) throw new Error("Sem cópia salva para esta exclusão.");

  const { data: exists } = await supabase.from("materias").select("id").eq("id", snap.id).maybeSingle();
  if (exists) throw new Error("Esta matéria já está na grade.");

  let blocoId: string | null = snap.bloco_id;
  const { data: bloco } = await supabase.from("blocos").select("id").eq("id", blocoId).maybeSingle();
  if (!bloco) {
    if (!entry.telejornal_id) throw new Error("O bloco original não existe mais.");
    const { data: first } = await supabase
      .from("blocos").select("id").eq("telejornal_id", entry.telejornal_id)
      .order("ordem", { ascending: true }).limit(1).maybeSingle();
    if (!first) throw new Error("O telejornal não tem blocos para receber a matéria.");
    blocoId = first.id;
  }

  const { data: last } = await supabase
    .from("materias").select("ordem").eq("bloco_id", blocoId)
    .order("ordem", { ascending: false }).limit(1).maybeSingle();

  const { created_at, updated_at, ...rest } = snap;
  const { error } = await supabase.from("materias").insert({
    ...rest,
    bloco_id: blocoId,
    ordem: (last?.ordem ?? 0) + 1,
  } as any);
  if (error) throw error;

  await supabase.from("materia_edit_history" as any)
    .update({ restored_at: new Date().toISOString() } as any).eq("id", entry.id);
};

export const valueToText = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) {
    return v.map((g: any) => (typeof g === "object" && g
      ? [g.linha1 ?? g.line1 ?? g.titulo, g.linha2 ?? g.line2 ?? g.texto].filter(Boolean).join(" | ")
      : String(g))).join("\n");
  }
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};

export type DiffToken = { type: "same" | "add" | "del"; text: string };

/** Diff simples por palavras (LCS). */
export const wordDiff = (a: string, b: string): DiffToken[] => {
  const A = a.split(/(\s+)/), B = b.split(/(\s+)/);
  if (A.length * B.length > 400000) {
    return [{ type: "del", text: a }, { type: "add", text: " " + b }];
  }
  const n = A.length, m = B.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: DiffToken[] = [];
  const push = (type: DiffToken["type"], text: string) => {
    const l = out[out.length - 1];
    if (l && l.type === type) l.text += text; else out.push({ type, text });
  };
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) { push("same", A[i]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) push("del", A[i++]);
    else push("add", B[j++]);
  }
  while (i < n) push("del", A[i++]);
  while (j < m) push("add", B[j++]);
  return out;
};
