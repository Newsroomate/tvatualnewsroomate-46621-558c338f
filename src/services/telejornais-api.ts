
import { supabase } from "@/integrations/supabase/client";
import { Telejornal } from "@/types";
import { toastService } from "@/utils/toast-utils";

export const fetchTelejornal = async (id: string): Promise<Telejornal | null> => {
  try {
    const { data, error } = await supabase
      .from('telejornais')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error("Erro ao buscar telejornal:", error);
      return null;
    }

    return data as Telejornal;
  } catch (error) {
    console.error("Erro ao buscar telejornal:", error);
    return null;
  }
};

export const createTelejornal = async (telejornal: Omit<Telejornal, 'id' | 'created_at'>): Promise<Telejornal | null> => {
  try {
    const { data, error } = await supabase
      .from('telejornais')
      .insert([telejornal])
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar telejornal:", error);
      throw error;
    }

    toastService.success("Telejornal criado", `${telejornal.nome} foi adicionado com sucesso`);
    return data as Telejornal;
  } catch (error) {
    console.error("Erro ao criar telejornal:", error);
    toastService.error("Erro ao criar telejornal", error instanceof Error ? error.message : "Erro desconhecido");
    return null;
  }
};

export const updateTelejornal = async (id: string, telejornal: Partial<Telejornal>): Promise<Telejornal | null> => {
  try {
    const { data, error } = await supabase
      .from('telejornais')
      .update(telejornal)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Erro ao atualizar telejornal ${id}:`, error);
      throw error;
    }

    return data as Telejornal;
  } catch (error) {
    console.error(`Erro ao atualizar telejornal ${id}:`, error);
    toastService.error("Erro ao atualizar telejornal", error instanceof Error ? error.message : "Erro desconhecido");
    return null;
  }
};

export const deleteTelejornal = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('telejornais')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Erro ao deletar telejornal ${id}:`, error);
      throw error;
    }

    toastService.success("Telejornal excluído", "O telejornal foi removido com sucesso");
    return true;
  } catch (error) {
    console.error(`Erro ao deletar telejornal ${id}:`, error);
    toastService.error("Erro ao excluir telejornal", error instanceof Error ? error.message : "Erro desconhecido");
    return false;
  }
};
