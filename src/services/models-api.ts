import { supabase } from "@/integrations/supabase/client";
import { fetchBlocosByTelejornal, fetchMateriasByBloco } from "@/services/api";
import { deleteAllBlocos } from "@/services/blocos-api";
import { createBloco } from "@/services/blocos-api";
import { createMateria } from "@/services/materias-api";

export interface SavedModel {
  id: string;
  nome: string;
  descricao?: string;
  estrutura: {
    blocos: Array<{
      id: string;
      nome: string;
      ordem: number;
      items: Array<{
        id: string;
        retranca: string;
        clip?: string;
        duracao: number;
        pagina?: string;
        reporter?: string;
        status?: string;
        texto?: string;
        cabeca?: string;
        gc?: string;
        ordem: number;
      }>;
    }>;
  };
  created_at: string;
  updated_at: string;
}

export interface SavedModelCreateInput {
  nome: string;
  descricao?: string;
  estrutura: {
    blocos: Array<{
      id: string;
      nome: string;
      ordem: number;
      items: Array<{
        id: string;
        retranca: string;
        clip?: string;
        duracao: number;
        pagina?: string;
        reporter?: string;
        status?: string;
        texto?: string;
        cabeca?: string;
        gc?: string;
        ordem: number;
      }>;
    }>;
  };
}

export const saveCurrentStructureAsModel = async (
  telejornalId: string,
  modelData: SavedModelCreateInput
): Promise<SavedModel> => {
  console.log("Salvando estrutura atual como modelo:", modelData);
  
  // Buscar blocos e matérias atuais
  const blocks = await fetchBlocosByTelejornal(telejornalId);
  const blocksWithItems = await Promise.all(
    blocks.map(async (block) => {
      const materias = await fetchMateriasByBloco(block.id);
      return {
        id: block.id,
        nome: block.nome,
        ordem: block.ordem,
        items: materias.map(materia => ({
          id: materia.id,
          retranca: materia.retranca,
          clip: materia.clip,
          duracao: materia.duracao || 0,
          pagina: materia.pagina,
          reporter: materia.reporter,
          status: materia.status,
          texto: materia.texto,
          cabeca: materia.cabeca,
          gc: materia.gc,
          ordem: materia.ordem
        }))
      };
    })
  );

  const estruturaCompleta = {
    ...modelData,
    estrutura: {
      blocos: blocksWithItems
    }
  };

  const { data, error } = await supabase
    .from('modelos_salvos')
    .insert({
      nome: estruturaCompleta.nome,
      descricao: estruturaCompleta.descricao,
      estrutura: estruturaCompleta.estrutura
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao salvar modelo:", error);
    throw error;
  }

  return data as SavedModel;
};

export const fetchAllSavedModels = async (): Promise<SavedModel[]> => {
  console.log("Buscando todos os modelos salvos");
  
  const { data, error } = await supabase
    .from('modelos_salvos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Erro ao buscar modelos salvos:", error);
    throw error;
  }

  return data as SavedModel[] || [];
};

export const deleteSavedModel = async (modelId: string): Promise<void> => {
  console.log("Excluindo modelo:", modelId);
  
  const { error } = await supabase
    .from('modelos_salvos')
    .delete()
    .eq('id', modelId);

  if (error) {
    console.error("Erro ao excluir modelo:", error);
    throw error;
  }
};

export const applyModelToTelejornal = async (
  model: SavedModel,
  telejornalId: string
): Promise<void> => {
  console.log("Aplicando modelo ao telejornal:", model.nome, telejornalId);
  
  try {
    // 1. Delete all existing blocks and materias (cascading delete will handle materias)
    await deleteAllBlocos(telejornalId);
    
    // 2. Create new blocks and materias from the model
    const modelBlocos = model.estrutura.blocos;
    
    for (const bloco of modelBlocos) {
      // Create the block
      const newBloco = await createBloco({
        nome: bloco.nome,
        ordem: bloco.ordem,
        telejornal_id: telejornalId
      });
      
      // Create materias for this block
      for (const item of bloco.items) {
        await createMateria({
          retranca: item.retranca,
          clip: item.clip,
          duracao: item.duracao,
          pagina: item.pagina,
          reporter: item.reporter,
          status: item.status,
          texto: item.texto,
          cabeca: item.cabeca,
          gc: item.gc,
          ordem: item.ordem,
          bloco_id: newBloco.id
        });
      }
    }
    
    console.log("Modelo aplicado com sucesso");
  } catch (error) {
    console.error("Erro ao aplicar modelo:", error);
    throw error;
  }
};
