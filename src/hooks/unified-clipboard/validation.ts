import { Materia } from '@/types';
import { CopiedBlock } from './types';
import { toast } from '@/hooks/use-toast';
import { logValidation } from './logger';

export const validateMateriaForCopy = (materia: Materia): boolean => {
  if (!materia) {
    logValidation('copiar matéria', false, 'Matéria nula/undefined');
    toast({
      title: "Erro ao copiar",
      description: "Matéria inválida para cópia",
      variant: "destructive"
    });
    return false;
  }

  if (!materia.retranca) {
    logValidation('copiar matéria', false, 'Retranca ausente');
    toast({
      title: "Erro ao copiar",
      description: "Matéria deve ter uma retranca para ser copiada",
      variant: "destructive"
    });
    return false;
  }

  logValidation('copiar matéria', true);
  return true;
};

export const validateBlockForCopy = (block: any, materias: Materia[]): boolean => {
  if (!block) {
    logValidation('copiar bloco', false, 'Bloco nulo/undefined');
    toast({
      title: "Erro ao copiar",
      description: "Bloco inválido para cópia",
      variant: "destructive"
    });
    return false;
  }

  if (!block.nome) {
    logValidation('copiar bloco', false, 'Nome do bloco ausente');
    toast({
      title: "Erro ao copiar",
      description: "Bloco deve ter um nome para ser copiado",
      variant: "destructive"
    });
    return false;
  }

  if (!materias || materias.length === 0) {
    logValidation('copiar bloco', false, 'Bloco sem matérias');
    toast({
      title: "Erro ao copiar",
      description: "Bloco deve ter pelo menos uma matéria para ser copiado",
      variant: "destructive"
    });
    return false;
  }

  logValidation('copiar bloco', true, `${materias.length} matérias encontradas`);
  return true;
};

export const validateMateriaForPaste = (copiedMateria: Materia | null, blocks: any[]): boolean => {
  if (!copiedMateria) {
    logValidation('colar matéria', false, 'Nenhuma matéria copiada');
    toast({
      title: "Nenhuma matéria copiada",
      description: "Copie uma matéria primeiro para poder colá-la",
      variant: "destructive"
    });
    return false;
  }

  if (!blocks || blocks.length === 0) {
    logValidation('colar matéria', false, 'Nenhum bloco disponível');
    toast({
      title: "Erro ao colar",
      description: "Nenhum bloco disponível para colar a matéria",
      variant: "destructive"
    });
    return false;
  }

  logValidation('colar matéria', true, `${blocks.length} blocos disponíveis`);
  return true;
};

export const validateBlockForPaste = (
  copiedBlock: CopiedBlock | null, 
  selectedJournal: string | null, 
  currentTelejornal: any
): boolean => {
  if (!copiedBlock) {
    logValidation('colar bloco', false, 'Nenhum bloco copiado');
    toast({
      title: "Nenhum bloco copiado",
      description: "Copie um bloco primeiro para poder colá-lo",
      variant: "destructive"
    });
    return false;
  }

  if (!selectedJournal) {
    logValidation('colar bloco', false, 'Nenhum telejornal selecionado');
    toast({
      title: "Nenhum telejornal selecionado",
      description: "Selecione um telejornal para colar o bloco",
      variant: "destructive"
    });
    return false;
  }

  if (!currentTelejornal?.espelho_aberto) {
    logValidation('colar bloco', false, 'Espelho fechado');
    toast({
      title: "Espelho fechado",
      description: "O espelho precisa estar aberto para colar blocos",
      variant: "destructive"
    });
    return false;
  }

  logValidation('colar bloco', true, `Bloco com ${copiedBlock.materias?.length || 0} matérias`);
  return true;
};
