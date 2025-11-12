
import { supabase } from "@/integrations/supabase/client";
import { toastService } from "@/utils/toast-utils";

export interface MateriaSnapshot {
  id: string;
  materia_original_id?: string;
  snapshot_id?: string;
  retranca: string;
  bloco_nome?: string;
  bloco_ordem?: number;
  ordem: number;
  duracao: number;
  clip?: string;
  tempo_clip?: string;
  pagina?: string;
  reporter?: string;
  editor?: string;
  status?: string;
  texto?: string;
  cabeca?: string;
  gc?: string;
  tipo_material?: string;
  local_gravacao?: string;
  tags?: string[];
  horario_exibicao?: string;
  is_snapshot: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MateriaSnapshotCreateInput {
  materia_original_id?: string;
  snapshot_id?: string;
  retranca: string;
  bloco_nome?: string;
  bloco_ordem?: number;
  ordem: number;
  duracao: number;
  clip?: string;
  tempo_clip?: string;
  pagina?: string;
  reporter?: string;
  editor?: string;
  status?: string;
  texto?: string;
  cabeca?: string;
  gc?: string;
  tipo_material?: string;
  local_gravacao?: string;
  tags?: string[];
}

export const createMateriaSnapshot = async (materia: MateriaSnapshotCreateInput): Promise<MateriaSnapshot> => {
  const { data: currentUser } = await supabase.auth.getUser();
  
  if (!currentUser.user) {
    throw new Error("Usuário não autenticado");
  }

  if (!materia.materia_original_id) {
    throw new Error("materia_original_id é obrigatório para criar snapshot");
  }

  const { data, error } = await supabase
    .from('materias_snapshots')
    .insert({
      materia_original_id: materia.materia_original_id,
      retranca: materia.retranca,
      bloco_nome: materia.bloco_nome,
      bloco_ordem: materia.bloco_ordem,
      ordem: materia.ordem,
      duracao: materia.duracao,
      clip: materia.clip,
      tempo_clip: materia.tempo_clip,
      pagina: materia.pagina,
      reporter: materia.reporter,
      editor: materia.editor,
      status: materia.status,
      texto: materia.texto,
      cabeca: materia.cabeca,
      gc: materia.gc,
      tipo_material: materia.tipo_material,
      local_gravacao: materia.local_gravacao,
      tags: materia.tags
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar matéria snapshot:', error);
    toastService.error("Erro ao criar matéria snapshot", error.message);
    throw error;
  }

  return { ...data, is_snapshot: true } as MateriaSnapshot;
};

export const updateMateriaSnapshot = async (id: string, updates: Partial<MateriaSnapshot>): Promise<MateriaSnapshot> => {
  if (!id) {
    const error = new Error('ID da matéria snapshot é obrigatório para atualização');
    console.error('updateMateriaSnapshot: Missing ID', { id, updates });
    throw error;
  }

  // Garantir que retranca exista no payload final
  if (!updates.retranca || updates.retranca.trim() === '') {
    throw new Error('Retranca é obrigatória para atualizar uma matéria snapshot');
  }

  // Verificar se snapshot já existe
  const { data: existing, error: checkError } = await supabase
    .from('materias_snapshots')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (checkError) {
    console.error('updateMateriaSnapshot: Error checking if materia snapshot exists:', checkError);
    throw new Error(`Erro ao verificar se a matéria snapshot existe: ${checkError.message}`);
  }

  const { data: currentUser } = await supabase.auth.getUser();
  if (!currentUser.user) {
    throw new Error("Usuário não autenticado");
  }

  if (!existing) {
    // Criar novo snapshot com os dados fornecidos
    const { data: created, error: createError } = await supabase
      .from('materias_snapshots')
      .insert({
        id,
        materia_original_id: updates.materia_original_id || id,
        retranca: updates.retranca!,
        bloco_nome: updates.bloco_nome,
        bloco_ordem: updates.bloco_ordem,
        ordem: updates.ordem || 1,
        duracao: updates.duracao || 0,
        clip: updates.clip,
        tempo_clip: updates.tempo_clip,
        pagina: updates.pagina,
        reporter: updates.reporter,
        editor: updates.editor,
        status: updates.status,
        texto: updates.texto,
        cabeca: updates.cabeca,
        gc: updates.gc,
        tipo_material: updates.tipo_material,
        local_gravacao: updates.local_gravacao,
        tags: updates.tags
      })
      .select()
      .single();

    if (createError) {
      console.error('updateMateriaSnapshot: Error creating materia snapshot:', createError);
      throw new Error(`Erro ao criar matéria snapshot: ${createError.message}`);
    }

    return { ...created, is_snapshot: true } as MateriaSnapshot;
  }

  // Atualizar com os novos dados
  const updateData: any = {};
  Object.keys(updates).forEach(key => {
    if (updates[key as keyof MateriaSnapshot] !== undefined) {
      updateData[key] = updates[key as keyof MateriaSnapshot];
    }
  });

  const { data, error } = await supabase
    .from('materias_snapshots')
    .update(updateData)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    console.error('updateMateriaSnapshot: Database error during update:', error);
    const errorMessage = error.message || 'Erro desconhecido ao atualizar matéria snapshot';
    toastService.error("Erro ao atualizar matéria snapshot", errorMessage);
    throw new Error(`Erro ao atualizar matéria snapshot: ${errorMessage}`);
  }

  if (!data) {
    console.error('updateMateriaSnapshot: No data returned after update:', { id });
    throw new Error('Nenhum dado retornado após a atualização da matéria snapshot');
  }

  return { ...data, is_snapshot: true } as MateriaSnapshot;
};

export const fetchMateriaSnapshotsBySnapshot = async (snapshotId: string): Promise<MateriaSnapshot[]> => {
  const { data, error } = await supabase
    .from('materias_snapshots')
    .select('*')
    .eq('materia_original_id', snapshotId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar matérias snapshots:', error);
    throw error;
  }

  return (data || []).map((row: any) => ({ ...row, is_snapshot: true })) as MateriaSnapshot[];
};

export const deleteMateriaSnapshot = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('materias_snapshots')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao excluir matéria snapshot:', error);
    
    // Check if it's a permission error
    if (error.code === 'PGRST116' || error.message.includes('permission')) {
      toastService.error("Acesso negado", "Você não tem permissão para excluir esta matéria snapshot");
    } else {
      toastService.error("Erro ao excluir matéria snapshot", error.message);
    }
    throw error;
  }

  return true;
};
