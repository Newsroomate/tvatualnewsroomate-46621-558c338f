
import { Materia } from '@/types';
import { toast } from '@/hooks/use-toast';

export const validatePasteOperation = (
  copiedMateria: Materia | null,
  blocks: any[]
): boolean => {
  console.log('Validação de paste - Estado do clipboard:', {
    copiedMateria: copiedMateria ? {
      id: copiedMateria.id,
      retranca: copiedMateria.retranca,
      hasData: !!copiedMateria
    } : null,
    sessionStorageMateria: sessionStorage.getItem('copiedMateria') ? 'exists' : 'empty',
    sessionStorageTime: sessionStorage.getItem('copiedMateriaTime'),
    blocksCount: blocks.length
  });

  if (!copiedMateria) {
    console.log('Tentativa de colar sem matéria copiada - verificando sessionStorage...');
    
    // Verificar se há dados no sessionStorage que não foram carregados
    const storedMateria = sessionStorage.getItem('copiedMateria');
    if (storedMateria) {
      console.log('Dados encontrados no sessionStorage mas não carregados no hook');
      toast({
        title: "Erro no sistema de clipboard",
        description: "Tente copiar a matéria novamente usando Ctrl+C",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Nenhuma matéria copiada",
        description: "Copie uma matéria primeiro no Espelho Geral usando Ctrl+C",
        variant: "destructive"
      });
    }
    return false;
  }

  if (!copiedMateria.retranca) {
    console.error('Matéria copiada não possui retranca:', copiedMateria);
    toast({
      title: "Erro na matéria copiada",
      description: "A matéria copiada não possui dados válidos",
      variant: "destructive"
    });
    return false;
  }

  if (blocks.length === 0) {
    toast({
      title: "Erro ao colar",
      description: "Nenhum bloco disponível para colar a matéria",
      variant: "destructive"
    });
    return false;
  }

  return true;
};
