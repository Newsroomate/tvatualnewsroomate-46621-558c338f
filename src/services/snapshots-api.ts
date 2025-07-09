
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface ClosedRundownSnapshot {
  id: string;
  telejornal_id: string;
  nome_telejornal: string;
  data_referencia: string;
  horario?: string;
  estrutura_completa: {
    blocos: Array<{
      id: string;
      nome: string;
      ordem: number;
      materias?: Array<{
        id: string;
        retranca: string;
        clip?: string;
        duracao: number;
        texto?: string;
        cabeca?: string;
        gc?: string; // Garantir que GC esteja incluído
        status?: string;
        pagina?: string;
        reporter?: string;
        ordem: number;
        tags?: string[];
        local_gravacao?: string;
        equipamento?: string;
        tipo_material?: string;
        tempo_clip?: string;
        bloco_nome?: string;
        bloco_ordem?: number;
        isEdited?: boolean;
      }>;
      items?: Array<{
        id: string;
        retranca: string;
        clip?: string;
        duracao: number;
        texto?: string;
        cabeca?: string;
        gc?: string; // Garantir que GC esteja incluído
        status?: string;
        pagina?: string;
        reporter?: string;
        ordem: number;
        tags?: string[];
        local_gravacao?: string;
        equipamento?: string;
        tipo_material?: string;
        tempo_clip?: string;
        bloco_nome?: string;
        bloco_ordem?: number;
        isEdited?: boolean;
      }>;
    }>;
    metadata: {
      total_blocos: number;
      total_materias: number;
      duracao_total: number;
      data_fechamento: string;
    };
  };
  created_at?: string;
  updated_at?: string;
}

export const closeRundown = async (
  telejornalId: string,
  dataReferencia: string,
  nomeTelejornal: string,
  horario?: string
): Promise<ClosedRundownSnapshot> => {
  console.log("Fechando espelho:", { telejornalId, dataReferencia, nomeTelejornal, horario });

  // Buscar todos os blocos do telejornal com suas matérias
  const { data: blocos, error: blocosError } = await supabase
    .from('blocos')
    .select(`
      id,
      nome,
      ordem,
      materias!inner (
        id,
        retranca,
        clip,
        duracao,
        texto,
        cabeca,
        gc,
        status,
        pagina,
        reporter,
        ordem,
        tags,
        local_gravacao,
        equipamento,
        tipo_material,
        tempo_clip
      )
    `)
    .eq('telejornal_id', telejornalId)
    .order('ordem');

  if (blocosError) {
    console.error("Erro ao buscar blocos:", blocosError);
    throw blocosError;
  }

  console.log("Blocos encontrados:", blocos);

  // Processar matérias para incluir informações do bloco e garantir que GC seja preservado
  const materiasParaSnapshot: any[] = [];
  
  blocos?.forEach((bloco: any) => {
    if (bloco.materias && Array.isArray(bloco.materias)) {
      bloco.materias.forEach((materia: any) => {
        console.log("Processando matéria para snapshot:", {
          id: materia.id,
          retranca: materia.retranca,
          gc: materia.gc, // Log para verificar se GC está sendo processado
          gcLength: materia.gc?.length || 0
        });

        materiasParaSnapshot.push({
          materia_original_id: materia.id,
          retranca: materia.retranca,
          bloco_nome: bloco.nome,
          bloco_ordem: bloco.ordem,
          ordem: materia.ordem,
          duracao: materia.duracao || 0,
          clip: materia.clip,
          tempo_clip: materia.tempo_clip,
          pagina: materia.pagina,
          reporter: materia.reporter,
          status: materia.status || 'draft',
          texto: materia.texto,
          cabeca: materia.cabeca,
          gc: materia.gc, // Garantir que GC seja incluído no snapshot
          tipo_material: materia.tipo_material,
          local_gravacao: materia.local_gravacao,
          tags: materia.tags || [],
          equipamento: materia.equipamento
        });
      });
    }
  });

  console.log("Matérias para snapshot (com GC):", materiasParaSnapshot.map(m => ({
    retranca: m.retranca,
    gc: m.gc,
    gcLength: m.gc?.length || 0
  })));

  const totalMaterias = materiasParaSnapshot.length;
  const duracaoTotal = materiasParaSnapshot.reduce((sum, m) => sum + (m.duracao || 0), 0);

  // Criar snapshot com estrutura completa incluindo GC
  const snapshotData = {
    telejornal_id: telejornalId,
    data_referencia: dataReferencia,
    nome_telejornal: nomeTelejornal,
    horario: horario,
    estrutura_completa: {
      blocos: blocos?.map(bloco => ({
        id: bloco.id,
        nome: bloco.nome,
        ordem: bloco.ordem,
        materias: bloco.materias?.map((materia: any) => ({
          id: materia.id,
          retranca: materia.retranca,
          clip: materia.clip,
          duracao: materia.duracao,
          texto: materia.texto,
          cabeca: materia.cabeca,
          gc: materia.gc, // Garantir que GC esteja na estrutura completa
          status: materia.status,
          pagina: materia.pagina,
          reporter: materia.reporter,
          ordem: materia.ordem,
          tags: materia.tags,
          local_gravacao: materia.local_gravacao,
          equipamento: materia.equipamento,
          tipo_material: materia.tipo_material,
          tempo_clip: materia.tempo_clip,
          bloco_nome: bloco.nome,
          bloco_ordem: bloco.ordem
        })) || []
      })) || [],
      metadata: {
        total_blocos: blocos?.length || 0,
        total_materias: totalMaterias,
        duracao_total: duracaoTotal,
        data_fechamento: new Date().toISOString()
      }
    }
  };

  console.log("Dados do snapshot (verificando GC):", {
    totalBlocos: snapshotData.estrutura_completa.blocos.length,
    materiasComGC: snapshotData.estrutura_completa.blocos.flatMap(b => b.materias).filter(m => m.gc && m.gc.length > 0).length
  });

  // Salvar snapshot principal
  const { data: snapshot, error: snapshotError } = await supabase
    .from('espelhos_salvos')
    .insert({
      telejornal_id: telejornalId,
      data_referencia: dataReferencia,
      nome: `${nomeTelejornal} - ${format(new Date(dataReferencia + 'T00:00:00'), 'dd/MM/yyyy')}${horario ? ` - ${horario}` : ''}`,
      estrutura: snapshotData.estrutura_completa
    })
    .select()
    .single();

  if (snapshotError) {
    console.error("Erro ao criar snapshot:", snapshotError);
    throw snapshotError;
  }

  console.log("Snapshot criado com sucesso:", snapshot.id);

  // Salvar matérias individuais na tabela de snapshots (incluindo GC)
  if (materiasParaSnapshot.length > 0) {
    const materiasComSnapshotId = materiasParaSnapshot.map(materia => ({
      ...materia,
      snapshot_id: snapshot.id
    }));

    console.log("Salvando matérias individuais (verificando GC):", {
      total: materiasComSnapshotId.length,
      comGC: materiasComSnapshotId.filter(m => m.gc && m.gc.length > 0).length
    });

    const { error: materiasError } = await supabase
      .from('materias_snapshots')
      .insert(materiasComSnapshotId);

    if (materiasError) {
      console.error("Erro ao salvar matérias do snapshot:", materiasError);
      throw materiasError;
    }

    console.log("Matérias do snapshot salvas com sucesso (incluindo GC)");
  }

  return {
    id: snapshot.id,
    telejornal_id: snapshot.telejornal_id,
    nome_telejornal: nomeTelejornal,
    data_referencia: snapshot.data_referencia,
    horario: horario,
    estrutura_completa: snapshotData.estrutura_completa,
    created_at: snapshot.created_at,
    updated_at: snapshot.updated_at
  };
};

export const fetchClosedRundowns = async (telejornalId?: string, targetDate?: string): Promise<ClosedRundownSnapshot[]> => {
  console.log("Buscando espelhos fechados:", { telejornalId, targetDate });
  
  let query = supabase
    .from('espelhos_salvos')
    .select(`
      id,
      telejornal_id,
      data_referencia,
      estrutura,
      created_at,
      updated_at,
      nome,
      telejornais!inner(
        id,
        nome,
        horario
      )
    `);

  if (telejornalId && telejornalId !== "all") {
    query = query.eq('telejornal_id', telejornalId);
  }

  if (targetDate) {
    console.log("Filtering closed rundowns by date:", targetDate);
    query = query.eq('data_referencia', targetDate);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao buscar espelhos fechados:", error);
    throw error;
  }

  console.log("Found closed rundowns:", data?.length || 0);

  return data?.map(item => ({
    id: item.id,
    telejornal_id: item.telejornal_id,
    nome_telejornal: item.telejornais?.nome || 'Telejornal',
    data_referencia: item.data_referencia,
    horario: item.telejornais?.horario,
    estrutura_completa: item.estrutura as ClosedRundownSnapshot['estrutura_completa'],
    created_at: item.created_at,
    updated_at: item.updated_at
  })) as ClosedRundownSnapshot[] || [];
};

// Alias para manter compatibilidade
export const fetchClosedRundownSnapshots = fetchClosedRundowns;

export const deleteClosedRundown = async (snapshotId: string): Promise<boolean> => {
  console.log("Deletando espelho fechado:", snapshotId);

  // Primeiro, deletar as matérias do snapshot
  const { error: materiasError } = await supabase
    .from('materias_snapshots')
    .delete()
    .eq('snapshot_id', snapshotId);

  if (materiasError) {
    console.error("Erro ao deletar matérias do snapshot:", materiasError);
    throw materiasError;
  }

  // Depois, deletar o snapshot principal
  const { error: snapshotError } = await supabase
    .from('espelhos_salvos')
    .delete()
    .eq('id', snapshotId);

  if (snapshotError) {
    console.error("Erro ao deletar snapshot:", snapshotError);
    throw snapshotError;
  }

  console.log("Espelho fechado deletado com sucesso");
  return true;
};
