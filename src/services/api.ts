import { supabase } from "@/integrations/supabase/client";
import { Telejornal, Bloco, Materia, Pauta, BlocoCreateInput, MateriaCreateInput, PautaCreateInput } from "@/types";
import { toast } from "@/hooks/use-toast";
import { enableRealtimeForTable } from "@/integrations/supabase/enableRealtime";

// Telejornais
export const fetchTelejornais = async () => {
  const { data, error } = await supabase
    .from('telejornais')
    .select('*')
    .order('horario');

  if (error) {
    console.error('Erro ao buscar telejornais:', error);
    throw error;
  }

  return data as Telejornal[];
};

export const fetchTelejornal = async (id: string) => {
  const { data, error } = await supabase
    .from('telejornais')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erro ao buscar telejornal:', error);
    throw error;
  }

  return data as Telejornal;
};

export interface TelejornalCreateInput {
  nome: string;
  horario?: string;
}

export const createTelejornal = async (telejornal: TelejornalCreateInput) => {
  // Ao criar um novo telejornal, o espelho começa fechado
  const telejornalWithDefaults = {
    ...telejornal,
    espelho_aberto: false
  };
  
  const { data, error } = await supabase
    .from('telejornais')
    .insert(telejornalWithDefaults)
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar telejornal:', error);
    toast({
      title: "Erro ao criar telejornal",
      description: error.message,
      variant: "destructive",
    });
    throw error;
  }

  toast({
    title: "Telejornal criado",
    description: `${telejornal.nome} foi adicionado com sucesso`,
  });

  return data as Telejornal;
};

export const updateTelejornal = async (id: string, updates: Partial<Telejornal>) => {
  // Habilitamos o suporte a realtime para atualizações de telejornais
  await enableRealtimeForTable('telejornais');
  
  const { data, error } = await supabase
    .from('telejornais')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar telejornal:', error);
    toast({
      title: "Erro ao atualizar telejornal",
      description: error.message,
      variant: "destructive",
    });
    throw error;
  }

  const actionMsg = updates.espelho_aberto !== undefined 
    ? (updates.espelho_aberto ? "Espelho aberto" : "Espelho fechado")
    : "Telejornal atualizado";

  toast({
    title: actionMsg,
    description: `${updates.nome || 'Telejornal'} foi atualizado com sucesso`,
  });

  return data as Telejornal;
};

export const deleteTelejornal = async (id: string) => {
  // First, delete all related materias in blocos of this telejornal
  const { data: blocos } = await supabase
    .from('blocos')
    .select('id')
    .eq('telejornal_id', id);
  
  if (blocos && blocos.length > 0) {
    for (const bloco of blocos) {
      await supabase
        .from('materias')
        .delete()
        .eq('bloco_id', bloco.id);
    }
    
    // Now delete all blocos
    await supabase
      .from('blocos')
      .delete()
      .eq('telejornal_id', id);
  }
  
  // Finally delete the telejornal
  const { error } = await supabase
    .from('telejornais')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao excluir telejornal:', error);
    toast({
      title: "Erro ao excluir telejornal",
      description: error.message,
      variant: "destructive",
    });
    throw error;
  }

  toast({
    title: "Telejornal excluído",
    description: "O telejornal foi removido com sucesso",
  });

  return true;
};

// Blocos
export const fetchBlocosByTelejornal = async (telejornalId: string) => {
  const { data, error } = await supabase
    .from('blocos')
    .select('*')
    .eq('telejornal_id', telejornalId)
    .order('ordem');

  if (error) {
    console.error('Erro ao buscar blocos:', error);
    throw error;
  }

  return data as Bloco[];
};

export const createBloco = async (bloco: BlocoCreateInput) => {
  const { data, error } = await supabase
    .from('blocos')
    .insert(bloco)
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar bloco:', error);
    toast({
      title: "Erro ao criar bloco",
      description: error.message,
      variant: "destructive",
    });
    throw error;
  }

  toast({
    title: "Bloco criado",
    description: `${bloco.nome} foi adicionado com sucesso`,
  });

  return data as Bloco;
};

// Matérias
export const fetchMateriasByBloco = async (blocoId: string) => {
  const { data, error } = await supabase
    .from('materias')
    .select('*')
    .eq('bloco_id', blocoId)
    .order('ordem');

  if (error) {
    console.error('Erro ao buscar matérias:', error);
    throw error;
  }

  return data as Materia[];
};

export const createMateria = async (materia: MateriaCreateInput) => {
  const { data, error } = await supabase
    .from('materias')
    .insert(materia)
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar matéria:', error);
    toast({
      title: "Erro ao criar matéria",
      description: error.message,
      variant: "destructive",
    });
    throw error;
  }

  toast({
    title: "Matéria criada",
    description: `${materia.retranca} foi adicionada com sucesso`,
  });

  return data as Materia;
};

export const updateMateria = async (id: string, updates: Partial<Materia>) => {
  const { data, error } = await supabase
    .from('materias')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar matéria:', error);
    toast({
      title: "Erro ao atualizar matéria",
      description: error.message,
      variant: "destructive",
    });
    throw error;
  }

  toast({
    title: "Matéria atualizada",
    description: `Alterações salvas com sucesso`,
  });

  return data as Materia;
};

export const deleteMateria = async (id: string) => {
  const { error } = await supabase
    .from('materias')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao excluir matéria:', error);
    toast({
      title: "Erro ao excluir matéria",
      description: error.message,
      variant: "destructive",
    });
    throw error;
  }

  toast({
    title: "Matéria excluída",
    description: `A matéria foi removida com sucesso`,
  });

  return true;
};

// Pautas
export const fetchPautas = async () => {
  const { data, error } = await supabase
    .from('pautas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar pautas:', error);
    throw error;
  }

  return data as Pauta[];
};

export const createPauta = async (pauta: PautaCreateInput) => {
  const { data, error } = await supabase
    .from('pautas')
    .insert(pauta)
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar pauta:', error);
    toast({
      title: "Erro ao criar pauta",
      description: error.message,
      variant: "destructive",
    });
    throw error;
  }

  toast({
    title: "Pauta criada",
    description: `${pauta.titulo} foi adicionada com sucesso`,
  });

  return data as Pauta;
};

export const updatePauta = async (id: string, updates: { titulo: string }) => {
  const { data, error } = await supabase
    .from('pautas')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar pauta:', error);
    toast({
      title: "Erro ao atualizar pauta",
      description: error.message,
      variant: "destructive",
    });
    throw error;
  }

  toast({
    title: "Pauta atualizada",
    description: `${updates.titulo} foi atualizada com sucesso`,
  });

  return data as Pauta;
};

export const deletePauta = async (id: string) => {
  const { error } = await supabase
    .from('pautas')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao excluir pauta:', error);
    toast({
      title: "Erro ao excluir pauta",
      description: error.message,
      variant: "destructive",
    });
    throw error;
  }

  toast({
    title: "Pauta excluída",
    description: "A pauta foi removida com sucesso",
  });

  return true;
};
