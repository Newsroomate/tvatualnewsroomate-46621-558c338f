
import { supabase } from "@/integrations/supabase/client";
import { Bloco, Materia } from "@/types";

export interface LastBlockData {
  nome: string;
  materias: Omit<Materia, 'id' | 'bloco_id'>[];
}

export const getLastBlockFromPreviousRundown = async (telejornalId: string): Promise<LastBlockData | null> => {
  try {
    console.log('Buscando último bloco do espelho anterior para telejornal:', telejornalId);
    
    // Buscar o último snapshot fechado deste telejornal específico
    const { data: lastSnapshot, error } = await supabase
      .from('espelhos_salvos')
      .select('*')
      .eq('telejornal_id', telejornalId)
      .order('data_salvamento', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar snapshot anterior:', error);
      return null;
    }

    if (!lastSnapshot) {
      console.log('Nenhum snapshot anterior encontrado para o telejornal:', telejornalId);
      return null;
    }

    console.log('Snapshot encontrado:', lastSnapshot.data_referencia);

    // Extrair a estrutura do snapshot
    const estrutura = lastSnapshot.estrutura as any;
    const blocos = estrutura?.blocos || [];

    if (blocos.length === 0) {
      console.log('Nenhum bloco encontrado no último snapshot');
      return null;
    }

    // Pegar o último bloco (maior ordem)
    const lastBlock = blocos.reduce((latest: any, current: any) => {
      return (current.ordem || 0) > (latest.ordem || 0) ? current : latest;
    });

    console.log('Último bloco encontrado:', lastBlock.nome, 'com', lastBlock.items?.length || 0, 'matérias');

    // Preparar as matérias do último bloco, removendo IDs e bloco_id
    const materias = (lastBlock.items || []).map((materia: any) => {
      const { id, bloco_id, ...materiaWithoutIds } = materia;
      return {
        ...materiaWithoutIds,
        ordem: materiaWithoutIds.ordem || 1,
        retranca: materiaWithoutIds.retranca || 'Sem título',
        duracao: materiaWithoutIds.duracao || 0,
        status: materiaWithoutIds.status || 'draft',
        clip: materiaWithoutIds.clip || '',
        pagina: materiaWithoutIds.pagina || '',
        reporter: materiaWithoutIds.reporter || '',
        texto: materiaWithoutIds.texto || '',
        cabeca: materiaWithoutIds.cabeca || ''
      };
    });

    return {
      nome: lastBlock.nome,
      materias
    };
  } catch (error) {
    console.error('Erro ao buscar último bloco:', error);
    return null;
  }
};
