
import { supabase } from "@/integrations/supabase/client";
import { Pauta } from "@/types";
import { toastService } from "@/utils/toast-utils";

export const updatePauta = async (id: string, pauta: Partial<Pauta>): Promise<Pauta | null> => {
  try {
    const { data, error } = await supabase
      .from('pautas')
      .update(pauta)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Erro ao atualizar pauta ${id}:`, error);
      throw error;
    }

    toastService.success("Pauta atualizada", "As alterações foram salvas com sucesso");
    return data as Pauta;
  } catch (error) {
    console.error(`Erro ao atualizar pauta ${id}:`, error);
    toastService.error("Erro ao atualizar pauta", error instanceof Error ? error.message : "Erro desconhecido");
    return null;
  }
};

export const deletePauta = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('pautas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Erro ao deletar pauta ${id}:`, error);
      throw error;
    }

    toastService.success("Pauta excluída", "A pauta foi removida com sucesso");
    return true;
  } catch (error) {
    console.error(`Erro ao deletar pauta ${id}:`, error);
    toastService.error("Erro ao excluir pauta", error instanceof Error ? error.message : "Erro desconhecido");
    return false;
  }
};
