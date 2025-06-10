
import { Materia } from '@/types';
import { duplicateMateria } from '@/services/materias-api';
import { toast } from '@/hooks/use-toast';

interface UsePasteMateriaProps {
  blocks: any[];
  setBlocks: (blocks: any[]) => void;
  selectedMateria: Materia | null;
  copiedMateria: Materia | null;
  clearClipboard: () => void;
}

export const usePasteMateria = ({
  blocks,
  setBlocks,
  selectedMateria,
  copiedMateria,
  clearClipboard
}: UsePasteMateriaProps) => {
  
  const pasteMateria = async () => {
    if (!copiedMateria) {
      toast({
        title: "Nenhuma matéria copiada",
        description: "Copie uma matéria primeiro usando Ctrl+C",
        variant: "destructive"
      });
      return;
    }

    try {
      let targetBlockId: string;
      let insertPosition: number;

      if (selectedMateria) {
        // Se há uma matéria selecionada, colar logo abaixo dela
        const targetBlock = blocks.find(block => 
          block.items.some((item: Materia) => item.id === selectedMateria.id)
        );
        
        if (targetBlock) {
          targetBlockId = targetBlock.id;
          const selectedIndex = targetBlock.items.findIndex(
            (item: Materia) => item.id === selectedMateria.id
          );
          insertPosition = selectedIndex + 1;
        } else {
          // Se não encontrar o bloco, usar o primeiro bloco disponível
          targetBlockId = blocks[0]?.id;
          insertPosition = blocks[0]?.items.length || 0;
        }
      } else {
        // Se não há matéria selecionada, colar no final do primeiro bloco
        targetBlockId = blocks[0]?.id;
        insertPosition = blocks[0]?.items.length || 0;
      }

      if (!targetBlockId) {
        toast({
          title: "Erro ao colar",
          description: "Nenhum bloco disponível para colar a matéria",
          variant: "destructive"
        });
        return;
      }

      // Criar dados para duplicação
      const materiaData = {
        retranca: `${copiedMateria.retranca} (Cópia)`,
        texto: copiedMateria.texto || '',
        duracao: copiedMateria.duracao || 0,
        tipo_material: copiedMateria.tipo_material || '',
        pagina: copiedMateria.pagina || '',
        clip: copiedMateria.clip || '',
        reporter: copiedMateria.reporter || '',
        gc: copiedMateria.gc || '',
        cabeca: copiedMateria.cabeca || '',
        status: copiedMateria.status || 'draft'
      };

      // Duplicar a matéria no bloco de destino
      const duplicatedMateria = await duplicateMateria(
        copiedMateria.id, 
        targetBlockId, 
        materiaData, 
        insertPosition
      );

      // Atualizar o estado local
      setBlocks(currentBlocks => 
        currentBlocks.map(block => {
          if (block.id === targetBlockId) {
            const updatedItems = [...block.items];
            updatedItems.splice(insertPosition, 0, duplicatedMateria);
            
            // Recalcular o tempo total
            const totalTime = updatedItems.reduce((sum, item) => sum + (item.duracao || 0), 0);
            
            return {
              ...block,
              items: updatedItems,
              totalTime
            };
          }
          return block;
        })
      );

      toast({
        title: "Matéria colada",
        description: `"${duplicatedMateria.retranca}" foi colada com sucesso`,
      });

    } catch (error) {
      console.error('Erro ao colar matéria:', error);
      toast({
        title: "Erro ao colar",
        description: "Não foi possível colar a matéria",
        variant: "destructive"
      });
    }
  };

  return { pasteMateria };
};
