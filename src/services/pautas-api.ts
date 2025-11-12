
import { supabase } from "@/integrations/supabase/client";
import { Pauta, PautaCreateInput } from "@/types";

export const fetchPautas = async () => {
  const { data, error } = await supabase
    .from('pautas')
    .select('*')
    .is('telejornal_id', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar pautas:', error);
    throw error;
  }

  // Mapear colunas do DB para o modelo usado no app
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

export const createPauta = async (pauta: PautaCreateInput, userId: string) => {
  console.log('[pautas-api] createPauta chamado');
  console.log('[pautas-api] userId recebido:', userId);
  console.log('[pautas-api] pauta recebida:', pauta);
  
  if (!userId) {
    const error = new Error('userId é obrigatório para criar uma pauta');
    console.error('[pautas-api] Erro:', error.message);
    throw error;
  }

  // Verificar sessão antes de fazer insert
  const { data: { session } } = await supabase.auth.getSession();
  console.log('[pautas-api] Status da sessão:', {
    hasSession: !!session,
    sessionUserId: session?.user?.id,
    providedUserId: userId,
    match: session?.user?.id === userId
  });

  if (!session) {
    const error = new Error('Sessão inválida. Faça login novamente.');
    console.error('[pautas-api] Erro:', error.message);
    throw error;
  }

  // Usar colunas existentes no DB
  const row = {
    titulo: pauta.titulo,
    descricao: pauta.descricao || null,
    data_cobertura: (pauta.data_cobertura || new Date().toISOString().slice(0, 10)),
    local: pauta.local || null,
    horario: pauta.horario || null,
    entrevistado: pauta.entrevistado || null,
    produtor: pauta.produtor || null,
    status: pauta.status || 'pendente',
    telejornal_id: null, // Pautas independentes não devem ter telejornal_id
    user_id: userId,
    proposta: pauta.proposta || null,
    encaminhamento: pauta.encaminhamento || null,
    informacoes: pauta.informacoes || null,
    programa: pauta.programa || null,
    reporter: pauta.reporter || null,
  };

  console.log('[pautas-api] Row a ser inserido na tabela pautas:', JSON.stringify(row, null, 2));

  const { data, error } = await supabase
    .from('pautas')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('[pautas-api] Erro do Supabase ao criar pauta:', error);
    console.error('[pautas-api] Código do erro:', error.code);
    console.error('[pautas-api] Mensagem do erro:', error.message);
    console.error('[pautas-api] Detalhes do erro:', error.details);
    throw new Error(`Erro ao criar pauta: ${error.message} (${error.code})`);
  }
  
  console.log('[pautas-api] Pauta criada com sucesso:', data);

  // Converter de volta para o modelo do app
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

export const updatePauta = async (id: string, updates: { 
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
  // Usar colunas existentes no DB
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
    .from('pautas')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar pauta:', error);
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

export const deletePauta = async (id: string) => {
  const { error } = await supabase
    .from('pautas')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao excluir pauta:', error);
    throw error;
  }

  return true;
};
