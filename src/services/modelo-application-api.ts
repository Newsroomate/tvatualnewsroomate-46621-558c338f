
import { supabase } from "@/integrations/supabase/client";
import { ModeloEspelho } from "@/types/modelos-espelho";
import { updateTelejornal } from "./telejornais-api";

export interface ApplyModelResult {
  success: boolean;
  message: string;
  createdBlocks?: any[];
}

export const applyModelToRundown = async (
  modelo: ModeloEspelho, 
  telejornalId: string
): Promise<ApplyModelResult> => {
  try {
    console.log("Aplicando modelo:", modelo.nome, "ao telejornal:", telejornalId);

    // 1. Primeiro, abrir o espelho do telejornal
    await updateTelejornal(telejornalId, { espelho_aberto: true });
    console.log("Espelho aberto com sucesso");

    // 2. Verificar se já existem blocos para este telejornal
    const { data: existingBlocks } = await supabase
      .from('blocos')
      .select('id')
      .eq('telejornal_id', telejornalId);

    // 3. Se existem blocos, deletar todas as matérias e blocos existentes
    if (existingBlocks && existingBlocks.length > 0) {
      console.log("Removendo blocos existentes...");
      
      // Deletar matérias primeiro (devido à constraint de foreign key)
      for (const bloco of existingBlocks) {
        await supabase
          .from('materias')
          .delete()
          .eq('bloco_id', bloco.id);
      }
      
      // Depois deletar os blocos
      await supabase
        .from('blocos')
        .delete()
        .eq('telejornal_id', telejornalId);
    }

    // 4. Criar novos blocos baseados no modelo
    const createdBlocks = [];
    
    for (const blocoModelo of modelo.estrutura.blocos) {
      console.log("Criando bloco:", blocoModelo.nome);
      
      // Criar o bloco
      const { data: novoBloco, error: blocoError } = await supabase
        .from('blocos')
        .insert({
          nome: blocoModelo.nome,
          ordem: blocoModelo.ordem,
          telejornal_id: telejornalId
        })
        .select()
        .single();

      if (blocoError) {
        console.error("Erro ao criar bloco:", blocoError);
        throw blocoError;
      }

      createdBlocks.push(novoBloco);

      // 5. Criar as matérias para este bloco
      if (blocoModelo.items && blocoModelo.items.length > 0) {
        const materias = blocoModelo.items.map(item => ({
          retranca: item.retranca,
          clip: item.clip || null,
          tempo_clip: item.tempo_clip || null,
          duracao: item.duracao || 0,
          pagina: item.pagina || null,
          reporter: item.reporter || null,
          status: item.status || 'draft',
          texto: item.texto || null,
          cabeca: item.cabeca || null,
          gc: item.gc || null,
          ordem: item.ordem,
          bloco_id: novoBloco.id
        }));

        console.log(`Criando ${materias.length} matérias para o bloco ${blocoModelo.nome}`);

        const { error: materiasError } = await supabase
          .from('materias')
          .insert(materias);

        if (materiasError) {
          console.error("Erro ao criar matérias:", materiasError);
          throw materiasError;
        }
      }
    }

    console.log("Modelo aplicado com sucesso!");
    
    return {
      success: true,
      message: `Modelo "${modelo.nome}" aplicado com sucesso`,
      createdBlocks
    };

  } catch (error) {
    console.error("Erro ao aplicar modelo:", error);
    return {
      success: false,
      message: `Erro ao aplicar modelo: ${error.message}`
    };
  }
};
