import { Materia } from '@/types';

export interface GeneralSchedulePasteData {
  bloco_id: string;
  ordem: number;
  retranca: string;
  texto?: string;
  duracao: number;
  cabeca?: string;
  gc?: string;
  clip?: string;
  tempo_clip?: string;
  reporter?: string;
  status?: string;
  tipo_material?: string;
  local_gravacao?: string;
  equipamento?: string;
  pagina?: string;
  tags?: string[];
  horario_exibicao?: string | null;
}

export const buildGeneralSchedulePasteData = (
  copiedMateria: Materia,
  targetBlockId: string,
  insertPosition: number,
  nextPageNumber: string
): GeneralSchedulePasteData => {
  console.log('Construindo dados completos para cola do Espelho Geral:', {
    originalRetranca: copiedMateria.retranca,
    targetBlockId,
    insertPosition,
    nextPageNumber,
    campos: Object.keys(copiedMateria).length,
    camposOriginais: copiedMateria
  });

  return {
    bloco_id: targetBlockId,
    ordem: insertPosition + 1,
    retranca: `${copiedMateria.retranca} (Do Histórico)`,
    
    // Preservar todos os campos de conteúdo do Espelho Geral
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
    tipo_material: copiedMateria.tipo_material || 'nota',
    
    // Preservar campos de produção
    local_gravacao: copiedMateria.local_gravacao || '',
    equipamento: copiedMateria.equipamento || '',
    
    // Preservar campos adicionais
    tags: copiedMateria.tags || [],
    horario_exibicao: copiedMateria.horario_exibicao || null,
    
    // Nova página no espelho aberto
    pagina: nextPageNumber
  };
};