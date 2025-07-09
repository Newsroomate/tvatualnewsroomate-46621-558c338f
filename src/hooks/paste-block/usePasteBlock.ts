
import { toast } from '@/hooks/use-toast';
import { createBloco, fetchBlocosByTelejornal } from '@/services/api';
import { createMateria } from '@/services/materias-api';

import { useClipboard } from '@/context/ClipboardContext';

interface CopiedBlock {
  id: string;
  nome: string;
  ordem: number;
  materias: any[];
  is_copied_block: true;
}

interface UsePasteBlockProps {
  selectedJournal: string | null;
  currentTelejornal: any;
  refreshBlocks: () => void;
}

export const usePasteBlock = ({
  selectedJournal,
  currentTelejornal,
  refreshBlocks
}: UsePasteBlockProps) => {
  const { copiedBlock, clearClipboard, validateClipboard } = useClipboard();
  
  const pasteBlock = async () => {
    // Pre-paste validation
    if (!validateClipboard()) {
      toast({
        title: "Clipboard inválido",
        description: "Os dados do clipboard expiraram ou são inválidos",
        variant: "destructive"
      });
      return;
    }

    if (!copiedBlock) {
      toast({
        title: "Nenhum bloco copiado",
        description: "Copie um bloco primeiro para poder colá-lo",
        variant: "destructive"
      });
      return;
    }

    if (!selectedJournal) {
      toast({
        title: "Nenhum telejornal selecionado",
        description: "Selecione um telejornal para colar o bloco",
        variant: "destructive"
      });
      return;
    }

    if (!currentTelejornal?.espelho_aberto) {
      toast({
        title: "Espelho fechado",
        description: "O espelho precisa estar aberto para colar blocos",
        variant: "destructive"
      });
      return;
    }

    console.log('Colando bloco:', copiedBlock.nome, `(${copiedBlock.materias.length} matérias)`);

    try {
      // Get existing blocks to determine next order
      const existingBlocks = await fetchBlocosByTelejornal(selectedJournal);
      const nextOrder = existingBlocks.length + 1;
      
      // Create new block
      const newBlock = await createBloco({
        nome: `${copiedBlock.nome} (Cópia)`,
        ordem: nextOrder,
        telejornal_id: selectedJournal
      });

      // Create all materias from copied block
      const createdMaterias = [];
      for (let i = 0; i < copiedBlock.materias.length; i++) {
        const originalMateria = copiedBlock.materias[i];
        
        const materiaData = {
          retranca: `${originalMateria.retranca} (Cópia)`,
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
          tempo_clip: originalMateria.tempo_clip || ''
        };

        const newMateria = await createMateria(materiaData);
        createdMaterias.push(newMateria);
      }

      // Calculate total duration
      const totalDuracao = createdMaterias.reduce((sum, m) => sum + (m.duracao || 0), 0);
      const minutos = Math.floor(totalDuracao / 60);
      const segundos = totalDuracao % 60;

      toast({
        title: "Bloco colado com sucesso",
        description: `"${newBlock.nome}" colado com ${createdMaterias.length} matérias (${minutos}:${segundos.toString().padStart(2, '0')})`,
      });

      console.log('Bloco colado com sucesso:', newBlock.nome);
      refreshBlocks();

    } catch (error) {
      console.error('Erro ao colar bloco:', error);
      toast({
        title: "Erro ao colar bloco",
        description: "Não foi possível colar o bloco. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return { pasteBlock };
};
