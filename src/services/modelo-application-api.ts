
import { supabase } from "@/integrations/supabase/client";
import { ModeloEspelho } from "@/types/modelos-espelho";
import { createBloco } from "@/services/blocos-api";
import { createMateria } from "@/services/materias-api";
import { toastService } from "@/utils/toast-utils";

export interface ApplyModelResult {
  success: boolean;
  message: string;
}

export const applyModelToTelejornal = async (
  modelo: ModeloEspelho,
  telejornalId: string
): Promise<ApplyModelResult> => {
  try {
    console.log('Aplicando modelo ao telejornal:', { modelo: modelo.nome, telejornalId });

    // 1. Abrir o espelho do telejornal
    const { error: updateError } = await supabase
      .from('telejornais')
      .update({ espelho_aberto: true })
      .eq('id', telejornalId);

    if (updateError) {
      console.error('Erro ao abrir espelho:', updateError);
      throw updateError;
    }

    // 2. Remover blocos e matérias existentes
    await clearExistingContent(telejornalId);

    // 3. Aplicar a estrutura do modelo
    await applyModelStructure(modelo, telejornalId);

    toastService.success(
      "Modelo aplicado com sucesso!",
      `O espelho foi aberto com a estrutura do modelo "${modelo.nome}"`
    );

    return {
      success: true,
      message: `Modelo "${modelo.nome}" aplicado com sucesso`
    };

  } catch (error) {
    console.error('Erro ao aplicar modelo:', error);
    toastService.error(
      "Erro ao aplicar modelo",
      "Não foi possível aplicar o modelo ao espelho"
    );
    
    return {
      success: false,
      message: "Erro ao aplicar modelo"
    };
  }
};

const clearExistingContent = async (telejornalId: string) => {
  console.log('Limpando conteúdo existente do telejornal:', telejornalId);

  // Buscar blocos do telejornal
  const { data: blocos, error: blocosError } = await supabase
    .from('blocos')
    .select('id')
    .eq('telejornal_id', telejornalId);

  if (blocosError) {
    console.error('Erro ao buscar blocos:', blocosError);
    throw blocosError;
  }

  if (blocos && blocos.length > 0) {
    const blocoIds = blocos.map(b => b.id);

    // Deletar matérias dos blocos
    const { error: materiasError } = await supabase
      .from('materias')
      .delete()
      .in('bloco_id', blocoIds);

    if (materiasError) {
      console.error('Erro ao deletar matérias:', materiasError);
      throw materiasError;
    }

    // Deletar blocos
    const { error: blocosDeleteError } = await supabase
      .from('blocos')
      .delete()
      .eq('telejornal_id', telejornalId);

    if (blocosDeleteError) {
      console.error('Erro ao deletar blocos:', blocosDeleteError);
      throw blocosDeleteError;
    }
  }
};

const applyModelStructure = async (modelo: ModeloEspelho, telejornalId: string) => {
  console.log('Aplicando estrutura do modelo:', modelo.nome);

  // Ordenar blocos por ordem
  const blocosOrdenados = [...modelo.estrutura.blocos].sort((a, b) => a.ordem - b.ordem);

  for (const blocoModelo of blocosOrdenados) {
    try {
      // Criar o bloco
      const novoBloco = await createBloco({
        nome: blocoModelo.nome,
        ordem: blocoModelo.ordem,
        telejornal_id: telejornalId
      });

      console.log('Bloco criado:', novoBloco.nome);

      // Ordenar matérias por ordem
      const materiasOrdenadas = [...blocoModelo.items].sort((a, b) => a.ordem - b.ordem);

      // Criar as matérias do bloco
      for (const materiaModelo of materiasOrdenadas) {
        try {
          await createMateria({
            retranca: materiaModelo.retranca,
            clip: materiaModelo.clip || '',
            tempo_clip: materiaModelo.tempo_clip || '',
            duracao: materiaModelo.duracao || 0,
            pagina: materiaModelo.pagina || '',
            reporter: materiaModelo.reporter || '',
            status: materiaModelo.status || 'draft',
            texto: materiaModelo.texto || '',
            cabeca: materiaModelo.cabeca || '',
            gc: materiaModelo.gc || '',
            ordem: materiaModelo.ordem,
            bloco_id: novoBloco.id
          });

          console.log('Matéria criada:', materiaModelo.retranca);
        } catch (materiaError) {
          console.error('Erro ao criar matéria:', materiaError);
          // Continuar com as próximas matérias mesmo se uma falhar
        }
      }
    } catch (blocoError) {
      console.error('Erro ao criar bloco:', blocoError);
      throw blocoError;
    }
  }
};
