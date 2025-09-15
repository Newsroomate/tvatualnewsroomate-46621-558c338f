import { Materia } from '@/types';
import { toast } from '@/hooks/use-toast';

export const validatePasteToGeneralSchedule = (
  copiedMateria: Materia | null,
  selectedJournal: string | null,
  currentTelejornal: any
): boolean => {
  console.log('Validação de paste para Espelho Geral:', {
    copiedMateria: copiedMateria ? {
      id: copiedMateria.id,
      retranca: copiedMateria.retranca,
      hasData: !!copiedMateria
    } : null,
    selectedJournal,
    telejornalAberto: currentTelejornal?.espelho_aberto,
    sessionStorageMateria: sessionStorage.getItem('copiedMateria') ? 'exists' : 'empty',
    sessionStorageBlock: sessionStorage.getItem('copiedBlock') ? 'exists' : 'empty'
  });

  // Verificar se há telejornal selecionado
  if (!selectedJournal) {
    toast({
      title: "Nenhum telejornal selecionado",
      description: "Selecione um telejornal para colar do Espelho Geral",
      variant: "destructive"
    });
    return false;
  }

  // Verificar se o espelho está aberto
  if (!currentTelejornal?.espelho_aberto) {
    toast({
      title: "Espelho fechado",
      description: "O espelho precisa estar aberto para receber conteúdo do Espelho Geral",
      variant: "destructive"
    });
    return false;
  }

  // Para matérias, verificar se há matéria copiada
  if (copiedMateria !== null && !copiedMateria) {
    console.log('Tentativa de colar matéria no Espelho Geral sem dados copiados');
    
    // Verificar se há dados no sessionStorage que não foram carregados
    const storedMateria = sessionStorage.getItem('copiedMateria');
    if (storedMateria) {
      console.log('Dados de matéria encontrados no sessionStorage mas não carregados no hook');
      toast({
        title: "Erro no sistema de clipboard",
        description: "Tente copiar a matéria novamente usando Ctrl+C",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Nenhuma matéria copiada",
        description: "Copie uma matéria primeiro no Espelho Geral",
        variant: "destructive"
      });
    }
    return false;
  }

  // Verificar se a matéria tem dados válidos
  if (copiedMateria && !copiedMateria.retranca) {
    console.error('Matéria copiada não possui retranca:', copiedMateria);
    toast({
      title: "Erro na matéria copiada",
      description: "A matéria copiada do Espelho Geral não possui dados válidos",
      variant: "destructive"
    });
    return false;
  }

  return true;
};