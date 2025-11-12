import { createBloco, fetchBlocosByTelejornal } from '@/services/api';
import { createMateria } from '@/services/materias-api';
import { CopiedBlock, PasteOperationResult } from './types';
import { logPasteStart, logPasteSuccess, logPasteError } from './logger';

export const executeBlockPaste = async (
  copiedBlock: CopiedBlock,
  selectedJournal: string,
  refreshBlocks?: () => void
): Promise<PasteOperationResult> => {
  try {
    logPasteStart('block', {
      blocoNome: copiedBlock.nome,
      totalMaterias: copiedBlock.materias.length,
      telejornalDestino: selectedJournal
    });

    // Buscar blocos existentes para determinar a próxima ordem
    const existingBlocks = await fetchBlocosByTelejornal(selectedJournal);
    const nextOrder = existingBlocks.length + 1;
    
    // Criar novo bloco
    const newBlock = await createBloco({
      nome: `${copiedBlock.nome} (Cópia)`,
      ordem: nextOrder,
      telejornal_id: selectedJournal
    });

    console.log('Novo bloco criado:', newBlock);

    // Criar todas as matérias do bloco copiado
    const createdMaterias = [];
    for (let i = 0; i < copiedBlock.materias.length; i++) {
      const originalMateria = copiedBlock.materias[i];
      
      // Preparar dados da matéria preservando TODOS os campos
      const materiaData = {
        retranca: `${originalMateria.retranca} (Cópia)`,
        texto: originalMateria.texto || '',
        duracao: originalMateria.duracao || 0,
        cabeca: originalMateria.cabeca || '',
        gc: originalMateria.gc || '', // Using gc instead of lauda (database field)
        // Note: 'teleprompter' and 'observacoes' fields removed - don't exist in materias table (only in materias_snapshots)
        clip: originalMateria.clip || '',
        tempo_clip: originalMateria.tempo_clip || '',
        reporter: originalMateria.reporter || '',
        status: originalMateria.status || 'draft',
        tipo_material: originalMateria.tipo_material || '',
        local_gravacao: originalMateria.local_gravacao || '',
        tags: originalMateria.tags || [],
        pagina: (i + 1).toString(),
        bloco_id: newBlock.id,
        ordem: i + 1
      };

      const newMateria = await createMateria(materiaData);
      createdMaterias.push(newMateria);
      
      console.log(`Matéria ${i + 1}/${copiedBlock.materias.length} criada:`, {
        retranca: newMateria.retranca,
        pagina: newMateria.pagina
      });
    }

    console.log('Bloco completo colado com sucesso:', {
      blocoNome: newBlock.nome,
      totalMaterias: createdMaterias.length
    });

    // Refresh dos blocos para mostrar o novo conteúdo
    if (refreshBlocks) {
      refreshBlocks();
    }

    // Calcular duração total do bloco
    const totalDuracao = createdMaterias.reduce((sum, m) => sum + (m.duracao || 0), 0);
    const minutos = Math.floor(totalDuracao / 60);
    const segundos = totalDuracao % 60;

    logPasteSuccess('block', {
      blocoId: newBlock.id,
      blocoNome: newBlock.nome,
      totalMaterias: createdMaterias.length,
      duracaoTotal: totalDuracao
    });

    return {
      success: true,
      message: `Bloco "${newBlock.nome}" foi colado com ${createdMaterias.length} matérias (${minutos}:${segundos.toString().padStart(2, '0')})`
    };

  } catch (error) {
    console.error('Erro ao colar bloco:', error);
    logPasteError('block', error);
    
    return {
      success: false,
      message: "Não foi possível colar o bloco",
      error: error instanceof Error ? error.message : String(error)
    };
  }
};