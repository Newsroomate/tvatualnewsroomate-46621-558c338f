import { supabase } from "@/integrations/supabase/client";
import type { Pauta } from "@/types";

export interface ContatoEntrevistado {
  id?: string;
  nome: string;
  telefone?: string;
  email?: string;
}

export interface ContatoEntrevistadoFull extends ContatoEntrevistado {
  id: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Busca contatos por nome (autocomplete). Case-insensitive, prefix match.
 */
export const searchContatos = async (query: string, limit = 8): Promise<ContatoEntrevistado[]> => {
  const q = query.trim();
  if (q.length < 2) return [];

  const { data, error } = await supabase
    .from("contatos_entrevistados" as any)
    .select("id, nome, telefone, email")
    .ilike("nome", `%${q}%`)
    .order("nome", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[contatos-entrevistados-api] searchContatos error:", error);
    return [];
  }
  return (data as any) || [];
};

/**
 * Lista todos os contatos cadastrados (para a aba Agenda).
 */
export const listAllContatos = async (): Promise<ContatoEntrevistadoFull[]> => {
  const { data, error } = await supabase
    .from("contatos_entrevistados" as any)
    .select("id, nome, telefone, email, created_at, updated_at")
    .order("nome", { ascending: true });

  if (error) {
    console.error("[contatos-entrevistados-api] listAllContatos error:", error);
    return [];
  }
  return (data as any) || [];
};

/**
 * Atualiza um contato existente (telefone/email).
 */
export const updateContato = async (
  id: string,
  patch: { telefone?: string | null; email?: string | null; nome?: string }
): Promise<void> => {
  const { error } = await supabase
    .from("contatos_entrevistados" as any)
    .update(patch)
    .eq("id", id);
  if (error) {
    console.error("[contatos-entrevistados-api] updateContato error:", error);
    throw error;
  }
};

/**
 * Exclui um contato (apenas editor_chefe via RLS).
 */
export const deleteContato = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("contatos_entrevistados" as any)
    .delete()
    .eq("id", id);
  if (error) {
    console.error("[contatos-entrevistados-api] deleteContato error:", error);
    throw error;
  }
};

/**
 * Busca pautas que contenham determinado contato (por nome, case-insensitive).
 * Faz busca client-side em entrevistados_contatos JSONB + fallback no campo legado.
 */
export const findPautasByContato = async (nome: string): Promise<Pauta[]> => {
  const n = nome.trim().toLowerCase();
  if (!n) return [];

  const { data, error } = await supabase
    .from("pautas")
    .select("*")
    .order("data_cobertura", { ascending: false });

  if (error) {
    console.error("[contatos-entrevistados-api] findPautasByContato error:", error);
    return [];
  }

  return (data || [])
    .filter((row: any) => {
      const list: any[] = Array.isArray(row.entrevistados_contatos) ? row.entrevistados_contatos : [];
      const inJsonb = list.some((c) => (c?.nome || "").toLowerCase() === n);
      const inLegacy = (row.entrevistado || "").toLowerCase().includes(n);
      return inJsonb || inLegacy;
    })
    .map((row: any) => ({
      id: row.id,
      titulo: row.titulo,
      descricao: row.descricao,
      data_cobertura: row.data_cobertura,
      local: row.local,
      horario: row.horario,
      entrevistado: row.entrevistado,
      entrevistados_contatos: Array.isArray(row.entrevistados_contatos) ? row.entrevistados_contatos : [],
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

/**
 * Upsert (insert or update) de um contato pelo nome (case-insensitive).
 */
export const upsertContato = async (
  contato: ContatoEntrevistado,
  userId?: string
): Promise<void> => {
  const nome = contato.nome.trim();
  if (!nome) return;

  const { data: existing, error: selErr } = await supabase
    .from("contatos_entrevistados" as any)
    .select("id, telefone, email")
    .ilike("nome", nome)
    .limit(1)
    .maybeSingle();

  if (selErr) {
    console.error("[contatos-entrevistados-api] select error:", selErr);
  }

  const telefone = contato.telefone?.trim() || null;
  const email = contato.email?.trim() || null;

  if (existing && (existing as any).id) {
    const next: any = {};
    if (telefone) next.telefone = telefone;
    if (email) next.email = email;
    if (Object.keys(next).length === 0) return;

    const { error } = await supabase
      .from("contatos_entrevistados" as any)
      .update(next)
      .eq("id", (existing as any).id);

    if (error) console.error("[contatos-entrevistados-api] update error:", error);
  } else {
    const { error } = await supabase
      .from("contatos_entrevistados" as any)
      .insert({
        nome,
        telefone,
        email,
        created_by: userId || null,
      });

    if (error && error.code !== "23505") {
      console.error("[contatos-entrevistados-api] insert error:", error);
    }
  }
};

export const upsertContatos = async (
  contatos: ContatoEntrevistado[],
  userId?: string
): Promise<void> => {
  await Promise.all(contatos.filter(c => c.nome?.trim()).map(c => upsertContato(c, userId)));
};
