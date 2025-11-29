import { supabase } from "@/integrations/supabase/client";
import { fetchBlocosByTelejornal, fetchMateriasByBloco } from "@/services/api";
import { toastService } from "@/utils/toast-utils";

interface LostRundownInfo {
  telejornal_id: string;
  telejornal_nome: string;
  data_referencia: string;
  bloco_count: number;
  materia_count: number;
}

/**
 * Identifica telejornais fechados que não têm snapshot correspondente em espelhos_salvos
 */
export const findLostRundowns = async (): Promise<LostRundownInfo[]> => {
  console.log("🔍 Iniciando busca por espelhos perdidos...");
  
  try {
    // Buscar todos os telejornais fechados
    const { data: closedTelejornais, error: tjError } = await supabase
      .from('telejornais')
      .select('*')
      .eq('espelho_aberto', false);
    
    if (tjError) throw tjError;
    
    if (!closedTelejornais || closedTelejornais.length === 0) {
      console.log("Nenhum telejornal fechado encontrado");
      return [];
    }
    
    console.log(`Encontrados ${closedTelejornais.length} telejornais fechados`);
    
    const lostRundowns: LostRundownInfo[] = [];
    
    // Para cada telejornal fechado, verificar se tem snapshot
    for (const tj of closedTelejornais) {
      console.log(`Verificando telejornal: ${tj.nome} (ID: ${tj.id})`);
      
      // Buscar snapshots deste telejornal
      const { data: snapshots, error: snapError } = await supabase
        .from('espelhos_salvos')
        .select('*')
        .eq('telejornal_id', tj.id)
        .order('created_at', { ascending: false });
      
      if (snapError) {
        console.error(`Erro ao buscar snapshots do telejornal ${tj.nome}:`, snapError);
        continue;
      }
      
      // Buscar blocos e matérias atuais do telejornal
      const blocks = await fetchBlocosByTelejornal(tj.id);
      
      let materiaCount = 0;
      for (const block of blocks) {
        const materias = await fetchMateriasByBloco(block.id);
        materiaCount += materias.length;
      }
      
      // Se tem blocos/matérias mas não tem snapshot, é um espelho perdido
      if (blocks.length > 0 && (!snapshots || snapshots.length === 0)) {
        console.log(`⚠️ ESPELHO PERDIDO: ${tj.nome} - ${blocks.length} blocos, ${materiaCount} matérias`);
        
        // Usar data de updated_at do telejornal como referência
        const dataRef = tj.updated_at ? new Date(tj.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        
        lostRundowns.push({
          telejornal_id: tj.id,
          telejornal_nome: tj.nome,
          data_referencia: dataRef,
          bloco_count: blocks.length,
          materia_count: materiaCount
        });
      } else {
        console.log(`✅ Telejornal ${tj.nome} tem ${snapshots?.length || 0} snapshot(s)`);
      }
    }
    
    console.log(`\n📊 RESUMO: ${lostRundowns.length} espelho(s) perdido(s) encontrado(s)`);
    return lostRundowns;
    
  } catch (error) {
    console.error("Erro ao buscar espelhos perdidos:", error);
    throw error;
  }
};

/**
 * Recupera um espelho perdido criando um snapshot a partir dos blocos e matérias existentes
 */
export const recoverLostRundown = async (
  telejornalId: string,
  telejornalNome: string,
  dataReferencia: string
): Promise<boolean> => {
  console.log(`🔧 Iniciando recuperação do espelho: ${telejornalNome}`);
  
  try {
    // Verificar autenticação
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      throw new Error("Usuário não autenticado");
    }
    
    // Buscar blocos e matérias
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
            tempo_clip: materia.tempo_clip,
            duracao: materia.duracao || 0,
            pagina: materia.pagina,
            reporter: materia.reporter,
            editor: materia.editor,
            equipamento: materia.equipamento,
            status: materia.status,
            texto: materia.texto,
            cabeca: materia.cabeca,
            gc: materia.gc,
            tipo_material: materia.tipo_material,
            local_gravacao: materia.local_gravacao,
            tags: materia.tags,
            horario_exibicao: materia.horario_exibicao,
            ordem: materia.ordem
          }))
        };
      })
    );
    
    const totalMaterias = blocksWithItems.reduce((sum, block) => sum + block.items.length, 0);
    console.log(`Estrutura recuperada: ${blocks.length} blocos, ${totalMaterias} matérias`);
    
    // Buscar dados do telejornal para incluir na estrutura
    const { data: telejornalData } = await supabase
      .from('telejornais')
      .select('id, nome, horario')
      .eq('id', telejornalId)
      .single();
    
    // Criar snapshot com nome indicando que foi recuperado
    const { error } = await supabase
      .from('espelhos_salvos')
      .insert({
        nome: `${telejornalNome} (RECUPERADO)`,
        telejornal_id: telejornalId,
        data_referencia: dataReferencia,
        estrutura: {
          telejornal: telejornalData ? {
            id: telejornalData.id,
            nome: telejornalData.nome,
            horario: telejornalData.horario || ''
          } : undefined,
          telejornal_id: telejornalId,
          nome_telejornal: telejornalData?.nome || telejornalNome,
          horario: telejornalData?.horario || '',
          blocos: blocksWithItems
        },
        user_id: currentUser.user.id
      });
    
    if (error) {
      console.error("Erro ao criar snapshot de recuperação:", error);
      throw error;
    }
    
    console.log(`✅ Espelho ${telejornalNome} recuperado com sucesso!`);
    return true;
    
  } catch (error) {
    console.error(`Erro ao recuperar espelho ${telejornalNome}:`, error);
    throw error;
  }
};

/**
 * Recupera todos os espelhos perdidos de uma só vez
 */
export const recoverAllLostRundowns = async (): Promise<{
  recovered: number;
  failed: number;
  details: Array<{ nome: string; success: boolean; error?: string }>;
}> => {
  console.log("🚀 Iniciando recuperação em massa de espelhos perdidos...");
  
  const lostRundowns = await findLostRundowns();
  
  if (lostRundowns.length === 0) {
    console.log("✅ Nenhum espelho perdido encontrado!");
    toastService.success("Nenhum espelho perdido", "Todos os espelhos fechados estão salvos corretamente.");
    return { recovered: 0, failed: 0, details: [] };
  }
  
  console.log(`Tentando recuperar ${lostRundowns.length} espelho(s)...`);
  
  const results: Array<{ nome: string; success: boolean; error?: string }> = [];
  let recovered = 0;
  let failed = 0;
  
  for (const rundown of lostRundowns) {
    try {
      await recoverLostRundown(
        rundown.telejornal_id,
        rundown.telejornal_nome,
        rundown.data_referencia
      );
      
      results.push({
        nome: rundown.telejornal_nome,
        success: true
      });
      
      recovered++;
      console.log(`✅ ${recovered}/${lostRundowns.length} recuperado`);
      
    } catch (error: any) {
      results.push({
        nome: rundown.telejornal_nome,
        success: false,
        error: error.message
      });
      
      failed++;
      console.error(`❌ Falha ao recuperar ${rundown.telejornal_nome}:`, error);
    }
  }
  
  console.log(`\n📊 RESULTADO FINAL: ${recovered} recuperados, ${failed} falharam`);
  
  if (recovered > 0) {
    toastService.success(
      "Recuperação concluída",
      `${recovered} espelho(s) recuperado(s) com sucesso${failed > 0 ? `, ${failed} falharam` : ''}`
    );
  }
  
  return { recovered, failed, details: results };
};
