
import { toast } from '@/hooks/use-toast';
import { createBloco, fetchBlocosByTelejornal } from '@/services/api';
import { createMateria } from '@/services/materias-api';
import { validateBlockPasteOperation } from '@/hooks/paste-materia/validation';

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
    console.log('🚀 Iniciando processo de colar bloco');
    
    // Usar validação centralizada
    if (!validateBlockPasteOperation(copiedBlock, selectedJournal, currentTelejornal)) {
      return;
    }

    console.log('📦 Colando bloco:', copiedBlock!.nome, `(${copiedBlock!.materias.length} matérias)`);

    try {
      // Obter blocos existentes para determinar próxima ordem
      const existingBlocks = await fetchBlocosByTelejornal(selectedJournal!);
      const nextOrder = existingBlocks.length + 1;
      
      console.log('📊 Criando novo bloco na ordem:', nextOrder);
      
      // Criar novo bloco
      const newBlock = await createBloco({
        nome: `${copiedBlock!.nome} (Cópia)`,
        ordem: nextOrder,
        telejornal_id: selectedJournal!
      });

      console.log('✅ Bloco criado:', newBlock);

      // Criar todas as matérias do bloco copiado
      const createdMaterias = [];
      for (let i = 0; i < copiedBlock!.materias.length; i++) {
        const originalMateria = copiedBlock!.materias[i];
        
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
          local_gravacao: originalMateria.local_gravacao || '',
          equipamento: originalMateria.equipamento || '',
          tempo_clip: originalMateria.tempo_clip || '',
          bloco_id: newBlock.id,
          ordem: i + 1
        };

        console.log(`📄 Criando matéria ${i + 1}/${copiedBlock!.materias.length}:`, originalMateria.retranca);
        const newMateria = await createMateria(materiaData);
        createdMaterias.push(newMateria);
      }

      // Calcular duração total
      const totalDuracao = createdMaterias.reduce((sum, m) => sum + (m.duracao || 0), 0);
      const minutos = Math.floor(totalDuracao / 60);
      const segundos = totalDuracao % 60;

      toast({
        title: "Bloco colado com sucesso",
        description: `"${newBlock.nome}" colado com ${createdMaterias.length} matérias (${minutos}:${segundos.toString().padStart(2, '0')})`,
      });

      console.log('✅ Bloco colado com sucesso:', {
        bloco: newBlock.nome,
        materias: createdMaterias.length,
        duracao: `${minutos}:${segundos.toString().padStart(2, '0')}`
      });
      
      refreshBlocks();

    } catch (error) {
      console.error('❌ Erro ao colar bloco:', error);
      toast({
        title: "Erro ao colar bloco",
        description: "Não foi possível colar o bloco. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return { pasteBlock };
};
