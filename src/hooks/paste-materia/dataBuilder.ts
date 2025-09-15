
import { Materia } from '@/types';
import { PasteMateriaData } from './types';

export const buildPasteMateriaData = (
  copiedMateria: Materia,
  targetBlockId: string,
  insertPosition: number,
  nextPageNumber: string
): PasteMateriaData => {
  console.log('Construindo dados completos para cola de matéria:', {
    originalRetranca: copiedMateria.retranca,
    campos: Object.keys(copiedMateria).length,
    camposOriginais: copiedMateria
  });

  return {
    bloco_id: targetBlockId,
    ordem: insertPosition,
    retranca: `${copiedMateria.retranca} (Cópia)`,
    
    // Preservar todos os campos de conteúdo
    texto: copiedMateria.texto || '',
    duracao: copiedMateria.duracao || 0,
    cabeca: copiedMateria.cabeca || '',
    gc: copiedMateria.gc || '',
    
    // Preservar campos de mídia
    clip: copiedMateria.clip || '',
    tempo_clip: copiedMateria.tempo_clip || '',
    
    // Preservar campos de pessoas e metadados
    reporter: copiedMateria.reporter || '',
    status: copiedMateria.status || 'draft',
    tipo_material: copiedMateria.tipo_material || '',
    
    // Preservar campos de produção
    local_gravacao: copiedMateria.local_gravacao || '',
    equipamento: copiedMateria.equipamento || '',
    
    // Preservar campos adicionais
    tags: copiedMateria.tags || [],
    horario_exibicao: copiedMateria.horario_exibicao || null,
    
    // Página será a próxima disponível no bloco
    pagina: nextPageNumber
  };
};
