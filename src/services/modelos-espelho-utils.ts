
import { ModeloEspelho } from "@/types/modelos-espelho";
import { Telejornal } from "@/types";
import { updateTelejornal, deleteAllBlocos, createBloco, createMateria } from "@/services/api";
import { toastService } from "@/utils/toast-utils";

export const applyModeloEspelho = async (
  modelo: ModeloEspelho,
  telejornalId: string,
  currentTelejornal: Telejornal
) => {
  try {
    console.log("Aplicando modelo:", modelo.nome);
    
    // 1. Deletar todos os blocos existentes
    await deleteAllBlocos(telejornalId);
    
    // 2. Abrir o espelho
    await updateTelejornal(telejornalId, {
      ...currentTelejornal,
      espelho_aberto: true
    });
    
    // 3. Criar blocos do modelo
    for (const blocoModelo of modelo.estrutura.blocos) {
      // Criar o bloco
      const novoBloco = await createBloco({
        nome: blocoModelo.nome,
        ordem: blocoModelo.ordem,
        telejornal_id: telejornalId
      });
      
      // Criar as matérias do bloco
      for (const materiaModelo of blocoModelo.items) {
        await createMateria({
          retranca: materiaModelo.retranca,
          clip: materiaModelo.clip || null,
          tempo_clip: materiaModelo.tempo_clip || null,
          duracao: materiaModelo.duracao || 0,
          pagina: materiaModelo.pagina || null,
          reporter: materiaModelo.reporter || null,
          status: materiaModelo.status || 'draft',
          texto: materiaModelo.texto || null,
          cabeca: materiaModelo.cabeca || null,
          gc: materiaModelo.gc || null,
          ordem: materiaModelo.ordem,
          bloco_id: novoBloco.id
        });
      }
    }
    
    toastService.success(
      "Modelo aplicado com sucesso!",
      `O espelho foi criado com base no modelo "${modelo.nome}"`
    );
    
    return true;
  } catch (error) {
    console.error("Erro ao aplicar modelo:", error);
    toastService.error(
      "Erro ao aplicar modelo",
      "Não foi possível aplicar o modelo selecionado"
    );
    throw error;
  }
};
