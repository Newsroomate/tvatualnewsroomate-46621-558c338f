
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
  status?: string;
  texto?: string;
  cabeca?: string;
  gc?: string;
  tipo_material?: string;
  local_gravacao?: string;
  tags?: string[];
  equipamento?: string;
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
  status?: string;
  texto?: string;
  cabeca?: string;
  gc?: string;
  tipo_material?: string;
  local_gravacao?: string;
  tags?: string[];
  equipamento?: string;
}

export const createMateriaSnapshot = async (materia: MateriaSnapshotCreateInput): Promise<MateriaSnapshot> => {
  const { data: currentUser } = await supabase.auth.getUser();
  
  if (!currentUser.user) {
    throw new Error("Usuário não autenticado");
  }

  const { data, error } = await supabase
    .from('materias_snapshots')
    .insert({
      ...materia,
      created_by: currentUser.user.id
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar matéria snapshot:', error);
    toastService.error("Erro ao criar matéria snapshot", error.message);
    throw error;
  }

  return data as MateriaSnapshot;
};

export const updateMateriaSnapshot = async (id: string, updates: Partial<MateriaSnapshot>): Promise<MateriaSnapshot> => {
  // Validate that ID exists
  if (!id) {
    const error = new Error('ID da matéria snapshot é obrigatório para atualização');
    console.error('updateMateriaSnapshot: Missing ID', { id, updates });
    throw error;
  }

  // Create a copy of the updates object to avoid modifying the original
  const updatesToSend = { ...updates };
  
  // Remove created_by from updates to prevent unauthorized ownership changes
  delete updatesToSend.created_by;
  
  // Ensure retranca is included since it's a required field
  if (updatesToSend.retranca === undefined || updatesToSend.retranca === null || updatesToSend.retranca.trim() === '') {
    console.error('updateMateriaSnapshot: Missing or empty retranca field', { id, updates });
    throw new Error('Retranca é obrigatória para atualizar uma matéria snapshot');
  }
  
  console.log('updateMateriaSnapshot: Sending updates to database:', { id, updates: updatesToSend });

  // First, check if the materia snapshot exists and user has permission
  const { data: existingMateria, error: checkError } = await supabase
    .from('materias_snapshots')
    .select('id, retranca, snapshot_id, created_by')
    .eq('id', id)
    .maybeSingle();

  if (checkError) {
    console.error('updateMateriaSnapshot: Error checking if materia snapshot exists:', checkError);
    throw new Error(`Erro ao verificar se a matéria snapshot existe: ${checkError.message}`);
  }

  // If materia snapshot doesn't exist, create it with proper ownership
  if (!existingMateria) {
    console.log('updateMateriaSnapshot: Materia snapshot not found, creating new one:', { id });
    
    const { data: currentUser } = await supabase.auth.getUser();
    
    if (!currentUser.user) {
      throw new Error("Usuário não autenticado");
    }

    const createData: MateriaSnapshotCreateInput = {
      materia_original_id: id,
      retranca: updatesToSend.retranca,
      bloco_nome: updatesToSend.bloco_nome || 'Bloco',
      bloco_ordem: updatesToSend.bloco_ordem || 1,
      ordem: updatesToSend.ordem || 1,
      duracao: updatesToSend.duracao || 0,
      clip: updatesToSend.clip,
      tempo_clip: updatesToSend.tempo_clip,
      pagina: updatesToSend.pagina,
      reporter: updatesToSend.reporter,
      status: updatesToSend.status || 'draft',
      texto: updatesToSend.texto,
      cabeca: updatesToSend.cabeca,
      gc: updatesToSend.gc,
      tipo_material: updatesToSend.tipo_material,
      local_gravacao: updatesToSend.local_gravacao,
      tags: updatesToSend.tags,
      equipamento: updatesToSend.equipamento
    };

    const { data: createdMateria, error: createError } = await supabase
      .from('materias_snapshots')
      .insert({
        ...createData,
        id,
        created_by: currentUser.user.id
      })
      .select()
      .single();

    if (createError) {
      console.error('updateMateriaSnapshot: Error creating materia snapshot:', createError);
      throw new Error(`Erro ao criar matéria snapshot: ${createError.message}`);
    }

    console.log('updateMateriaSnapshot: Successfully created materia snapshot:', createdMateria);
    return createdMateria as MateriaSnapshot;
  }

  // Perform the update
  const { data, error } = await supabase
    .from('materias_snapshots')
    .update(updatesToSend)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    console.error('updateMateriaSnapshot: Database error during update:', error);
    const errorMessage = error.message || 'Erro desconhecido ao atualizar matéria snapshot';
    
    // Check if it's a permission error
    if (error.code === 'PGRST116' || error.message.includes('permission')) {
      toastService.error("Acesso negado", "Você não tem permissão para editar esta matéria snapshot");
    } else {
      toastService.error("Erro ao atualizar matéria snapshot", errorMessage);
    }
    throw new Error(`Erro ao atualizar matéria snapshot: ${errorMessage}`);
  }

  if (!data) {
    console.error('updateMateriaSnapshot: No data returned after update:', { id });
    throw new Error('Nenhum dado retornado após a atualização da matéria snapshot');
  }

  console.log('updateMateriaSnapshot: Successfully updated materia snapshot:', data);
  return data as MateriaSnapshot;
};

export const fetchMateriaSnapshotsBySnapshot = async (snapshotId: string): Promise<MateriaSnapshot[]> => {
  const { data, error } = await supabase
    .from('materias_snapshots')
    .select('*')
    .eq('snapshot_id', snapshotId)
    .order('ordem');

  if (error) {
    console.error('Erro ao buscar matérias snapshots:', error);
    throw error;
  }

  return data as MateriaSnapshot[];
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
