
import { toast } from '@/hooks/use-toast';
import { createBloco, fetchBlocosByTelejornal } from '@/services/api';
import { createMateria } from '@/services/materias-api';

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
  copiedBlock: CopiedBlock | null;
  clearClipboard: () => void;
  refreshBlocks: () => void;
}

export const usePasteBlock = ({
  selectedJournal,
  currentTelejornal,
  copiedBlock,
  clearClipboard,
  refreshBlocks
}: UsePasteBlockProps) => {
  
  const pasteBlock = async () => {
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

    console.log('Iniciando processo de colar bloco completo:', {
      blocoCopiado: {
        nome: copiedBlock.nome,
        totalMaterias: copiedBlock.materias.length,
        materiasRetrancas: copiedBlock.materias.map(m => m.retranca)
      },
      telejornalDestino: selectedJournal
    });

    try {
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
        
        // Preparar dados da matéria preservando todos os campos importantes
        const materiaData = {
          retranca: `${originalMateria.retranca} (Cópia)`,
          clip: originalMateria.clip || '',
          duracao: originalMateria.duracao || 0,
          pagina: (i + 1).toString(), // Convert to string
          reporter: originalMateria.reporter || '',
          status: originalMateria.status || 'draft',
          texto: originalMateria.texto || '',
          cabeca: originalMateria.cabeca || '',
          gc: originalMateria.gc || '',
          tipo_material: originalMateria.tipo_material || 'nota',
          bloco_id: newBlock.id,
          ordem: i + 1,
          // Preservar outros campos importantes
          tempo_clip: originalMateria.tempo_clip || ''
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

      // Calcular duração total do bloco
      const totalDuracao = createdMaterias.reduce((sum, m) => sum + (m.duracao || 0), 0);
      const minutos = Math.floor(totalDuracao / 60);
      const segundos = totalDuracao % 60;

      toast({
        title: "Bloco colado com sucesso",
        description: `Bloco "${newBlock.nome}" foi colado com ${createdMaterias.length} matérias (${minutos}:${segundos.toString().padStart(2, '0')})`,
      });

      // Refresh dos blocos para mostrar o novo conteúdo
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
