import { toast } from '@/hooks/use-toast';
import { Materia } from '@/types';
import { validatePasteToGeneralSchedule } from './validation';
import { determineGeneralScheduleTarget } from './targeting';
import { buildGeneralSchedulePasteData } from './dataBuilder';
import { createMateria, updateMateriasOrdem } from '@/services/materias-api';
import { createBloco } from '@/services/api';

interface UsePasteToGeneralScheduleProps {
  selectedJournal: string | null;
  currentTelejornal: any;
  copiedMateria: Materia | null;
  copiedBlock: any | null;
  clearClipboard: () => void;
  refreshBlocks: () => void;
}

export const usePasteToGeneralSchedule = ({
  selectedJournal,
  currentTelejornal,
  copiedMateria,
  copiedBlock,
  clearClipboard,
  refreshBlocks
}: UsePasteToGeneralScheduleProps) => {
  
  const pasteMateria = async () => {
    console.log('Tentativa de colar matéria no Espelho Geral:', {
      copiedMateria: copiedMateria?.retranca,
      selectedJournal,
      telejornalAberto: currentTelejornal?.espelho_aberto
    });

    // Validação específica para Espelho Geral
    if (!validatePasteToGeneralSchedule(copiedMateria, selectedJournal, currentTelejornal)) {
      return;
    }

    // Determinar onde colar no espelho aberto selecionado
    const pasteTarget = await determineGeneralScheduleTarget(selectedJournal);
    if (!pasteTarget) {
      toast({
        title: "Erro ao colar",
        description: "Não foi possível determinar onde colar a matéria",
        variant: "destructive"
      });
      return;
    }

    const { targetBlockId, insertPosition, nextPageNumber } = pasteTarget;

    // Construir dados da matéria preservando informações do Espelho Geral
    const materiaData = buildGeneralSchedulePasteData(
      copiedMateria!,
      targetBlockId,
      insertPosition,
      nextPageNumber
    );

    console.log('Colando matéria do Espelho Geral para espelho aberto:', {
      origem: 'Espelho Geral',
      destino: selectedJournal,
      materiaData
    });

    try {
      // Criar matéria no espelho aberto
      const newMateria = await createMateria(materiaData);
      console.log('Matéria colada com sucesso:', newMateria);

      toast({
        title: "Matéria colada do Espelho Geral",
        description: `"${newMateria.retranca}" foi colada no espelho aberto na página ${nextPageNumber}`,
      });

      // Refresh para mostrar a nova matéria
      refreshBlocks();

    } catch (error) {
      console.error('Erro ao colar matéria do Espelho Geral:', error);
      toast({
        title: "Erro ao colar",
        description: "Não foi possível colar a matéria do Espelho Geral",
        variant: "destructive"
      });
    }
  };

  const pasteBlock = async () => {
    console.log('Tentativa de colar bloco no Espelho Geral:', {
      copiedBlock: copiedBlock?.nome,
      selectedJournal,
      telejornalAberto: currentTelejornal?.espelho_aberto
    });

    if (!copiedBlock) {
      toast({
        title: "Nenhum bloco copiado",
        description: "Copie um bloco primeiro para poder colá-lo",
        variant: "destructive"
      });
      return;
    }

    if (!validatePasteToGeneralSchedule(null, selectedJournal, currentTelejornal)) {
      return;
    }

    try {
      // Buscar blocos existentes para próxima ordem
      const { fetchBlocosByTelejornal } = await import('@/services/api');
      const existingBlocks = await fetchBlocosByTelejornal(selectedJournal!);
      const nextOrder = existingBlocks.length + 1;
      
      // Criar novo bloco no espelho aberto
      const newBlock = await createBloco({
        nome: `${copiedBlock.nome} (Do Histórico)`,
        ordem: nextOrder,
        telejornal_id: selectedJournal!
      });

      console.log('Bloco do Espelho Geral criado no espelho aberto:', newBlock);

      // Criar todas as matérias do bloco
      const createdMaterias = [];
      for (let i = 0; i < copiedBlock.materias.length; i++) {
        const originalMateria = copiedBlock.materias[i];
        
        const materiaData = {
          retranca: `${originalMateria.retranca} (Do Histórico)`,
          clip: originalMateria.clip || '',
          duracao: originalMateria.duracao || 0,
          pagina: (i + 1).toString(),
          reporter: originalMateria.reporter || '',
          status: originalMateria.status || 'draft',
          texto: originalMateria.texto || '',
          cabeca: originalMateria.cabeca || '',
          gc: originalMateria.gc || '',
          tipo_material: originalMateria.tipo_material || 'nota',
          bloco_id: newBlock.id,
          ordem: i + 1,
          tempo_clip: originalMateria.tempo_clip || '',
          local_gravacao: originalMateria.local_gravacao || '',
          equipamento: originalMateria.equipamento || ''
        };

        const newMateria = await createMateria(materiaData);
        createdMaterias.push(newMateria);
      }

      console.log('Bloco completo colado do Espelho Geral:', {
        blocoNome: newBlock.nome,
        totalMaterias: createdMaterias.length
      });

      const totalDuracao = createdMaterias.reduce((sum, m) => sum + (m.duracao || 0), 0);
      const minutos = Math.floor(totalDuracao / 60);
      const segundos = totalDuracao % 60;

      toast({
        title: "Bloco colado do Espelho Geral",
        description: `Bloco "${newBlock.nome}" foi colado no espelho aberto com ${createdMaterias.length} matérias (${minutos}:${segundos.toString().padStart(2, '0')})`,
      });

      refreshBlocks();

    } catch (error) {
      console.error('Erro ao colar bloco do Espelho Geral:', error);
      toast({
        title: "Erro ao colar bloco",
        description: "Não foi possível colar o bloco do Espelho Geral",
        variant: "destructive"
      });
    }
  };

  return { pasteMateria, pasteBlock };
};