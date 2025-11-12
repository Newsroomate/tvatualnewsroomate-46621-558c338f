import { supabase } from "@/integrations/supabase/client";
import { Pauta, PautaCreateInput } from "@/types";

export const fetchPautasByTelejornal = async (telejornalId: string) => {
  const { data, error } = await supabase
    .from('pautas_telejornal')
    .select('*')
    .eq('telejornal_id', telejornalId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar pautas do telejornal:', error);
    throw error;
  }

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
    telejornal_id: row.telejornal_id,
    proposta: row.proposta,
    encaminhamento: row.encaminhamento,
    informacoes: row.informacoes,
    programa: row.programa,
    reporter: row.reporter,
  })) as Pauta[];
};

export const createPautaTelejornal = async (pauta: PautaCreateInput, userId: string) => {
  console.log('[pautas-telejornal-api] createPautaTelejornal chamado');
  console.log('[pautas-telejornal-api] userId recebido:', userId);
  console.log('[pautas-telejornal-api] pauta recebida:', pauta);
  
  if (!pauta.telejornal_id) {
    const error = new Error('telejornal_id é obrigatório para pautas de telejornal');
    console.error('[pautas-telejornal-api] Erro:', error.message);
    throw error;
  }

  if (!userId) {
    const error = new Error('userId é obrigatório para criar uma pauta');
    console.error('[pautas-telejornal-api] Erro:', error.message);
    throw error;
  }

  // Verificar sessão antes de fazer insert
  const { data: { session } } = await supabase.auth.getSession();
  console.log('[pautas-telejornal-api] Status da sessão:', {
    hasSession: !!session,
    sessionUserId: session?.user?.id,
    providedUserId: userId,
    match: session?.user?.id === userId
  });

  if (!session) {
    const error = new Error('Sessão inválida. Faça login novamente.');
    console.error('[pautas-telejornal-api] Erro:', error.message);
    throw error;
  }

  const row = {
    titulo: pauta.titulo,
    descricao: pauta.descricao || null,
    data_cobertura: (pauta.data_cobertura || new Date().toISOString().slice(0, 10)),
    local: pauta.local || null,
    horario: pauta.horario || null,
    entrevistado: pauta.entrevistado || null,
    produtor: pauta.produtor || null,
    status: pauta.status || 'pendente',
    telejornal_id: pauta.telejornal_id,
    user_id: userId,
    proposta: pauta.proposta || null,
    encaminhamento: pauta.encaminhamento || null,
    informacoes: pauta.informacoes || null,
    programa: pauta.programa || null,
    reporter: pauta.reporter || null,
  };

  console.log('[pautas-telejornal-api] Row a ser inserido na tabela pautas_telejornal:', JSON.stringify(row, null, 2));

  const { data, error } = await supabase
    .from('pautas_telejornal')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('[pautas-telejornal-api] Erro do Supabase ao criar pauta do telejornal:', error);
    console.error('[pautas-telejornal-api] Código do erro:', error.code);
    console.error('[pautas-telejornal-api] Mensagem do erro:', error.message);
    console.error('[pautas-telejornal-api] Detalhes do erro:', error.details);
    throw new Error(`Erro ao criar pauta do telejornal: ${error.message} (${error.code})`);
  }
  
  console.log('[pautas-telejornal-api] Pauta de telejornal criada com sucesso:', data);

  return {
    id: data.id,
    titulo: data.titulo,
    descricao: data.descricao,
    data_cobertura: data.data_cobertura,
    local: data.local,
    horario: data.horario,
    entrevistado: data.entrevistado,
    produtor: data.produtor,
    status: data.status,
    created_at: data.created_at,
    updated_at: data.updated_at,
    telejornal_id: data.telejornal_id,
    proposta: data.proposta,
    encaminhamento: data.encaminhamento,
    informacoes: data.informacoes,
    programa: data.programa,
    reporter: data.reporter,
  } as Pauta;
};

export const updatePautaTelejornal = async (id: string, updates: { 
  titulo: string;
  descricao?: string;
  local?: string;
  horario?: string;
  entrevistado?: string;
  produtor?: string;
  data_cobertura?: string;
  status?: string;
  proposta?: string;
  encaminhamento?: string;
  informacoes?: string;
  programa?: string;
  reporter?: string;
}) => {
  const row: any = {
    titulo: updates.titulo,
    descricao: updates.descricao || null,
    local: updates.local || null,
    horario: updates.horario || null,
    entrevistado: updates.entrevistado || null,
    produtor: updates.produtor || null,
    status: updates.status || 'pendente',
    proposta: updates.proposta || null,
    encaminhamento: updates.encaminhamento || null,
    informacoes: updates.informacoes || null,
    programa: updates.programa || null,
    reporter: updates.reporter || null,
  };
  if (updates.data_cobertura) {
    row.data_cobertura = updates.data_cobertura;
  }

  const { data, error } = await supabase
    .from('pautas_telejornal')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar pauta do telejornal:', error);
    throw error;
  }

  return {
    id: data.id,
    titulo: data.titulo,
    descricao: data.descricao,
    data_cobertura: data.data_cobertura,
    local: data.local,
    horario: data.horario,
    entrevistado: data.entrevistado,
    produtor: data.produtor,
    status: data.status,
    created_at: data.created_at,
    updated_at: data.updated_at,
    telejornal_id: data.telejornal_id,
    proposta: data.proposta,
    encaminhamento: data.encaminhamento,
    informacoes: data.informacoes,
    programa: data.programa,
    reporter: data.reporter,
  } as Pauta;
};

export const deletePautaTelejornal = async (id: string) => {
  const { error } = await supabase
    .from('pautas_telejornal')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao excluir pauta do telejornal:', error);
    throw error;
  }

  return true;
};
