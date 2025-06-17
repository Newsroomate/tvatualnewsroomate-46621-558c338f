
import { toast } from '@/hooks/use-toast';
import { createBloco } from '@/services/blocos-api';
import { createMateria } from '@/services/materias-api';
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
    console.log('Iniciando colagem de bloco:', {
      copiedBloco: !!copiedBloco,
      telejornalId,
      isEspelhoOpen,
      blocksCount: blocks.length
    });

    if (!copiedBloco) {
      toast({
        title: "Nenhum bloco copiado",
        description: "Copie um bloco primeiro usando o botão de copiar",
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

    try {
      // 1. Determinar a próxima ordem do bloco
      const nextOrder = Math.max(...blocks.map(b => b.ordem || 0), 0) + 1;
      
      // 2. Criar o novo bloco
      const newBlocoData = {
        nome: copiedBloco.nome,
        telejornal_id: telejornalId,
        ordem: nextOrder
      };

      console.log('Criando novo bloco:', newBlocoData);
      const newBloco = await createBloco(newBlocoData);

      // 3. Criar as matérias do bloco
      const newMaterias: Materia[] = [];
      
      for (let i = 0; i < copiedBloco.materias.length; i++) {
        const originalMateria = copiedBloco.materias[i];
        
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
          tags: originalMateria.tags || []
        };

        const newMateria = await createMateria(materiaData);
        newMaterias.push(newMateria);
      }

      // 4. Atualizar estado local
      const newBlockWithItems = {
        ...newBloco,
        items: newMaterias,
        totalTime: copiedBloco.totalTime
      };

      setBlocks((currentBlocks) => [...currentBlocks, newBlockWithItems]);

      // 5. Limpar clipboard
      clearClipboard();

      toast({
        title: "Bloco colado com sucesso",
        description: `Bloco "${copiedBloco.nome}" foi colado com ${copiedBloco.materias.length} matérias`,
      });

      console.log('Bloco colado com sucesso:', newBlockWithItems);

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
