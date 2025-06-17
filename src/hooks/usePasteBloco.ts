
import { toast } from '@/hooks/use-toast';
import { createBloco } from '@/services/blocos-api';
import { createMateria, updateMateriasOrdem } from '@/services/materias-api';
import { Materia } from '@/types';

interface BlocoClipboard {
  id: string;
  nome: string;
  ordem: number;
  materias: Materia[];
  totalTime: number;
}

interface UsePasteBlocoProps {
  blocks: any[];
  setBlocks: (updater: (prevBlocks: any[]) => any[]) => void;
  copiedBloco: BlocoClipboard | null;
  clearClipboard: () => void;
  telejornalId: string | null;
  isEspelhoOpen: boolean;
}

export const usePasteBloco = ({
  blocks,
  setBlocks,
  copiedBloco,
  clearClipboard,
  telejornalId,
  isEspelhoOpen
}: UsePasteBlocoProps) => {
  
  const pasteBloco = async () => {
    if (!copiedBloco) {
      toast({
        title: "Nenhum bloco copiado",
        description: "Não há bloco na área de transferência para colar",
        variant: "destructive"
      });
      return;
    }

    if (!telejornalId) {
      toast({
        title: "Telejornal não selecionado",
        description: "Selecione um telejornal para colar o bloco",
        variant: "destructive"
      });
      return;
    }

    if (!isEspelhoOpen) {
      toast({
        title: "Espelho fechado",
        description: "Abra o espelho do telejornal para colar o bloco",
        variant: "destructive"
      });
      return;
    }

    console.log('Iniciando processo de colar bloco:', {
      blocoCopiado: {
        nome: copiedBloco.nome,
        materias: copiedBloco.materias.length,
        totalTime: copiedBloco.totalTime
      },
      telejornalDestino: telejornalId,
      blocosExistentes: blocks.length
    });

    try {
      // 1. Criar o novo bloco
      const nextOrder = Math.max(...blocks.map(b => b.ordem), 0) + 1;
      const newBlocoData = {
        nome: copiedBloco.nome,
        telejornal_id: telejornalId,
        ordem: nextOrder
      };

      console.log('Criando novo bloco:', newBlocoData);
      const newBloco = await createBloco(newBlocoData);

      // 2. Criar as matérias do bloco
      console.log('Criando matérias do bloco...');
      const newMaterias: Materia[] = [];
      
      for (let i = 0; i < copiedBloco.materias.length; i++) {
        const originalMateria = copiedBloco.materias[i];
        
        // Preparar dados da matéria preservando todos os campos
        const materiaData = {
          bloco_id: newBloco.id,
          ordem: i,
          retranca: originalMateria.retranca || '',
          clip: originalMateria.clip || '',
          tempo_clip: originalMateria.tempo_clip || '',
          duracao: originalMateria.duracao || 0,
          texto: originalMateria.texto || '',
          cabeca: originalMateria.cabeca || '',
          gc: originalMateria.gc || '',
          status: originalMateria.status || 'draft',
          pagina: originalMateria.pagina || '',
          reporter: originalMateria.reporter || '',
          tipo_material: originalMateria.tipo_material || '',
          local_gravacao: originalMateria.local_gravacao || '',
          equipamento: originalMateria.equipamento || '',
          tags: originalMateria.tags || [],
          horario_exibicao: originalMateria.horario_exibicao || ''
        };

        console.log(`Criando matéria ${i + 1}/${copiedBloco.materias.length}:`, {
          retranca: materiaData.retranca,
          duracao: materiaData.duracao
        });

        const newMateria = await createMateria(materiaData);
        newMaterias.push(newMateria);
      }

      // 3. Atualizar estado local com o novo bloco e matérias
      const newBlockWithItems = {
        ...newBloco,
        items: newMaterias,
        totalTime: copiedBloco.totalTime
      };

      setBlocks((currentBlocks) => [...currentBlocks, newBlockWithItems]);

      // 4. Limpar clipboard após sucesso
      clearClipboard();

      toast({
        title: "Bloco colado com sucesso",
        description: `Bloco "${copiedBloco.nome}" foi colado com ${copiedBloco.materias.length} matérias`,
      });

      console.log('Bloco colado com sucesso:', {
        novoBloco: newBloco.nome,
        materiasColadas: newMaterias.length,
        tempoTotal: copiedBloco.totalTime
      });

    } catch (error) {
      console.error('Erro ao colar bloco:', error);
      
      toast({
        title: "Erro ao colar bloco",
        description: "Não foi possível colar o bloco. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return { pasteBloco };
};
