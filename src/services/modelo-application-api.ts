
import { createBloco } from "@/services/blocos-api";
import { createMateria } from "@/services/materias-api";
import { ModeloEspelho } from "@/types/models";
import { updateTelejornal } from "@/services/api";
import { Telejornal } from "@/types";

export const applyModeloToTelejornal = async (
  modelo: ModeloEspelho, 
  telejornalId: string, 
  currentTelejornal: Telejornal
): Promise<void> => {
  console.log("Applying model to telejornal:", { modelo, telejornalId });
  
  try {
    // 1. First, open the telejornal
    await updateTelejornal(telejornalId, {
      ...currentTelejornal,
      espelho_aberto: true
    });

    // 2. Create blocks and materias from the model structure
    for (const blocoData of modelo.estrutura.blocos) {
      console.log("Creating block:", blocoData.nome);
      
      // Create the block
      const newBloco = await createBloco({
        nome: blocoData.nome,
        ordem: blocoData.ordem,
        telejornal_id: telejornalId
      });

      // Create materias for this block
      for (const materiaData of blocoData.materias) {
        console.log("Creating materia:", materiaData.retranca);
        
        await createMateria({
          retranca: materiaData.retranca,
          bloco_id: newBloco.id,
          ordem: materiaData.ordem,
          duracao: materiaData.duracao,
          clip: materiaData.clip,
          tempo_clip: materiaData.tempo_clip,
          texto: materiaData.texto,
          cabeca: materiaData.cabeca,
          gc: materiaData.gc,
          status: materiaData.status || 'draft',
          pagina: materiaData.pagina,
          reporter: materiaData.reporter,
          local_gravacao: materiaData.local_gravacao,
          tags: materiaData.tags,
          equipamento: materiaData.equipamento
        });
      }
    }

    console.log("Model applied successfully");
  } catch (error) {
    console.error("Error applying model:", error);
    throw error;
  }
};
