
import { Materia } from '@/types';
import { toast } from '@/hooks/use-toast';

interface CopiedBlock {
  id: string;
  nome: string;
  ordem: number;
  materias: Materia[];
  is_copied_block: true;
}

export const validatePasteOperation = (
  copiedMateria: Materia | null,
  blocks: any[],
  copiedBlock?: CopiedBlock | null
): boolean => {
  console.log('🔍 Validando operação de paste:', { 
    temMateria: !!copiedMateria, 
    temBloco: !!copiedBlock,
    numeroBloco: blocks.length 
  });

  // Verificar se há algo copiado
  if (!copiedMateria && !copiedBlock) {
    console.log('❌ Nenhum conteúdo copiado encontrado');
    toast({
      title: "Nada foi copiado",
      description: "Copie uma matéria ou bloco primeiro no Espelho Geral usando Ctrl+C",
      variant: "destructive"
    });
    return false;
  }

  // Se há um bloco copiado, mas estamos tentando colar como matéria
  if (copiedBlock && !copiedMateria) {
    console.log('⚠️ Bloco copiado detectado, mas tentando colar como matéria');
    toast({
      title: "Bloco copiado detectado",
      description: `Você copiou o bloco "${copiedBlock.nome}" com ${copiedBlock.materias.length} matérias. Use a função de colar bloco ou copie uma matéria individual.`,
      variant: "destructive"
    });
    return false;
  }

  // Validação específica para matéria
  if (copiedMateria) {
    if (!copiedMateria.retranca) {
      console.error('❌ Matéria copiada sem retranca:', copiedMateria);
      toast({
        title: "Erro na matéria copiada",
        description: "A matéria copiada não possui dados válidos (retranca ausente)",
        variant: "destructive"
      });
      return false;
    }

    if (blocks.length === 0) {
      console.log('❌ Nenhum bloco disponível para colar matéria');
      toast({
        title: "Erro ao colar",
        description: "Nenhum bloco disponível para colar a matéria",
        variant: "destructive"
      });
      return false;
    }

    console.log('✅ Validação de matéria passou');
    return true;
  }

  // Se chegou aqui, algo deu errado
  console.error('❌ Estado de validação inconsistente');
  toast({
    title: "Erro de validação",
    description: "Estado inconsistente do clipboard. Tente copiar novamente.",
    variant: "destructive"
  });
  return false;
};

export const validateBlockPasteOperation = (
  copiedBlock: CopiedBlock | null,
  selectedJournal: string | null,
  currentTelejornal: any
): boolean => {
  console.log('🔍 Validando operação de paste de bloco:', { 
    temBloco: !!copiedBlock,
    jornalSelecionado: !!selectedJournal,
    espelhoAberto: currentTelejornal?.espelho_aberto 
  });

  if (!copiedBlock) {
    console.log('❌ Nenhum bloco copiado');
    toast({
      title: "Nenhum bloco copiado",
      description: "Copie um bloco primeiro para poder colá-lo",
      variant: "destructive"
    });
    return false;
  }

  if (!selectedJournal) {
    console.log('❌ Nenhum telejornal selecionado');
    toast({
      title: "Nenhum telejornal selecionado",
      description: "Selecione um telejornal para colar o bloco",
      variant: "destructive"
    });
    return false;
  }

  if (!currentTelejornal?.espelho_aberto) {
    console.log('❌ Espelho fechado');
    toast({
      title: "Espelho fechado",
      description: "O espelho precisa estar aberto para colar blocos",
      variant: "destructive"
    });
    return false;
  }

  console.log('✅ Validação de bloco passou');
  return true;
};
