
import { supabase } from "@/integrations/supabase/client";
import { Bloco, BlocoCreateInput } from "@/types";
import { useToast } from "@/hooks/use-toast";

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
    useToast().toast({
      title: "Erro ao criar bloco",
      description: error.message,
      variant: "destructive",
    });
    throw error;
  }

  useToast().toast({
    title: "Bloco criado",
    description: `${bloco.nome} foi adicionado com sucesso`,
  });

  return data as Bloco;
};
