
import { supabase } from "@/integrations/supabase/client";
import { Telejornal } from "@/types";
import { toast } from "@/hooks/use-toast";
import { enableRealtimeForTable } from "@/integrations/supabase/enableRealtime";

export interface TelejornalCreateInput {
  nome: string;
  horario?: string;
}

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
