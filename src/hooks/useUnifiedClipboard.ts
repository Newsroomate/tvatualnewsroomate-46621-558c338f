import { useState, useEffect } from 'react';
import { Materia } from '@/types';
import { toast } from '@/hooks/use-toast';

interface CopiedBlock {
  id: string;
  nome: string;
  ordem: number;
  materias: Materia[];
  is_copied_block: true;
  source_context?: 'general_schedule' | 'news_schedule';
}

interface CopiedMateriaExtended extends Materia {
  source_context?: 'general_schedule' | 'news_schedule';
  source_telejornal?: string;
  source_bloco_nome?: string;
}

const CLIPBOARD_EXPIRY = 5 * 60 * 1000; // 5 minutos

export const useUnifiedClipboard = () => {
  const [copiedMateria, setCopiedMateria] = useState<CopiedMateriaExtended | null>(null);
  const [copiedBlock, setCopiedBlock] = useState<CopiedBlock | null>(null);

  // Load from sessionStorage on mount
  useEffect(() => {
    const loadStorageData = () => {
      try {
        // Verificar timestamps para carregar apenas o item mais recente
        const storedMateria = sessionStorage.getItem('copiedMateria');
        const storedMateriaTime = sessionStorage.getItem('copiedMateriaTime');
        const storedBlock = sessionStorage.getItem('copiedBlock');
        const storedBlockTime = sessionStorage.getItem('copiedBlockTime');
        
        const materiaTimestamp = storedMateriaTime ? parseInt(storedMateriaTime) : 0;
        const blockTimestamp = storedBlockTime ? parseInt(storedBlockTime) : 0;
        
        console.log('Unified clipboard: Loading data with timestamp validation:', {
          hasMateria: !!storedMateria,
          hasBlock: !!storedBlock,
          materiaTimestamp,
          blockTimestamp,
          mostRecent: materiaTimestamp > blockTimestamp ? 'materia' : 'block'
        });
        
        // Se matéria for mais recente, carregar apenas ela
        if (materiaTimestamp > blockTimestamp && storedMateria && storedMateriaTime) {
          const timeElapsed = Date.now() - materiaTimestamp;
          if (timeElapsed < CLIPBOARD_EXPIRY) {
            const materiaData = JSON.parse(storedMateria);
            setCopiedMateria(materiaData);
            setCopiedBlock(null); // Garantir que bloco seja null
            console.log('Unified clipboard: Matéria loaded (mais recente):', materiaData.retranca);
          } else {
            sessionStorage.removeItem('copiedMateria');
            sessionStorage.removeItem('copiedMateriaTime');
            setCopiedMateria(null);
          }
        }
        // Se bloco for mais recente, carregar apenas ele
        else if (blockTimestamp > materiaTimestamp && storedBlock && storedBlockTime) {
          const timeElapsed = Date.now() - blockTimestamp;
          if (timeElapsed < CLIPBOARD_EXPIRY) {
            const blockData = JSON.parse(storedBlock);
            setCopiedBlock(blockData);
            setCopiedMateria(null); // Garantir que matéria seja null
            console.log('Unified clipboard: Bloco loaded (mais recente):', blockData.nome);
          } else {
            sessionStorage.removeItem('copiedBlock');
            sessionStorage.removeItem('copiedBlockTime');
            setCopiedBlock(null);
          }
        }
        // Se nenhum timestamp válido, limpar tudo
        else {
          console.log('Unified clipboard: No valid timestamps, clearing all');
          setCopiedMateria(null);
          setCopiedBlock(null);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do clipboard:', error);
        setCopiedMateria(null);
        setCopiedBlock(null);
      }
    };

    loadStorageData();
    
    // Check periodically for storage changes (cross-tab)
    const interval = setInterval(loadStorageData, 1000);
    return () => clearInterval(interval);
  }, []);

  const copyMateria = (
    materia: Materia, 
    context: 'general_schedule' | 'news_schedule' = 'news_schedule',
    telejornalNome?: string,
    blocoNome?: string
  ) => {
    console.log('Unified clipboard: Copiando matéria (limpando bloco anterior):', {
      retranca: materia.retranca,
      context,
      telejornal: telejornalNome,
      bloco: blocoNome,
      blocoAnterior: copiedBlock?.nome || 'nenhum'
    });

    const materiaWithContext: CopiedMateriaExtended = {
      ...materia,
      source_context: context,
      source_telejornal: telejornalNome,
      source_bloco_nome: blocoNome
    };

    // CRÍTICO: Limpar o bloco ANTES de setar a matéria
    setCopiedBlock(null);
    setCopiedMateria(materiaWithContext);

    // Save to sessionStorage - GARANTIR limpeza total do bloco
    try {
      // Remover dados de bloco PRIMEIRO
      sessionStorage.removeItem('copiedBlock');
      sessionStorage.removeItem('copiedBlockTime');
      
      // Depois salvar dados da matéria
      const materiaString = JSON.stringify(materiaWithContext);
      sessionStorage.setItem('copiedMateria', materiaString);
      sessionStorage.setItem('copiedMateriaTime', Date.now().toString());
      
      console.log('Unified clipboard: Matéria salva e bloco anterior removido:', {
        materiaSize: materiaString.length + ' chars',
        timestamp: Date.now(),
        blocoRemovido: true
      });
    } catch (error) {
      console.error('Erro ao salvar matéria no sessionStorage:', error);
    }

    const contextLabel = context === 'general_schedule' ? 'Espelho Geral' : 'espelho aberto';
    
    toast({
      title: "Matéria copiada",
      description: `"${materia.retranca}" foi copiada do ${contextLabel}. Use Ctrl+V para colar.`,
    });

    console.log('Unified clipboard: Matéria copiada com sucesso:', {
      retranca: materia.retranca,
      context,
      telejornal: telejornalNome,
      bloco: blocoNome
    });
  };

  const copyBlock = (
    block: any, 
    materias: Materia[],
    context: 'general_schedule' | 'news_schedule' = 'news_schedule'
  ) => {
    console.log('Unified clipboard: Copiando bloco (limpando matéria anterior):', {
      nome: block.nome,
      materiasCount: materias.length,
      context,
      materiaAnterior: copiedMateria?.retranca || 'nenhuma'
    });

    const blockWithContext: CopiedBlock = {
      id: block.id,
      nome: block.nome,
      ordem: block.ordem,
      materias: materias,
      is_copied_block: true,
      source_context: context
    };

    // CRÍTICO: Limpar a matéria ANTES de setar o bloco
    setCopiedMateria(null);
    setCopiedBlock(blockWithContext);

    // Save to sessionStorage - GARANTIR limpeza total da matéria
    try {
      // Remover dados de matéria PRIMEIRO
      sessionStorage.removeItem('copiedMateria');
      sessionStorage.removeItem('copiedMateriaTime');
      
      // Depois salvar dados do bloco
      const blockString = JSON.stringify(blockWithContext);
      sessionStorage.setItem('copiedBlock', blockString);
      sessionStorage.setItem('copiedBlockTime', Date.now().toString());
      
      console.log('Unified clipboard: Bloco salvo e matéria anterior removida:', {
        blockSize: blockString.length + ' chars',
        timestamp: Date.now(),
        materiaRemovida: true
      });
    } catch (error) {
      console.error('Erro ao salvar bloco no sessionStorage:', error);
    }

    const contextLabel = context === 'general_schedule' ? 'Espelho Geral' : 'espelho aberto';
    const duracaoTotal = materias.reduce((sum, m) => sum + (m.duracao || 0), 0);
    const minutos = Math.floor(duracaoTotal / 60);
    const segundos = duracaoTotal % 60;

    toast({
      title: "Bloco copiado",
      description: `Bloco "${block.nome}" foi copiado do ${contextLabel} com ${materias.length} matérias (${minutos}:${segundos.toString().padStart(2, '0')}).`,
    });

    console.log('Unified clipboard: Bloco copiado com sucesso:', {
      nome: block.nome,
      materias: materias.length,
      context
    });
  };

  const clearClipboard = () => {
    setCopiedMateria(null);
    setCopiedBlock(null);
    
    sessionStorage.removeItem('copiedMateria');
    sessionStorage.removeItem('copiedMateriaTime');
    sessionStorage.removeItem('copiedBlock');
    sessionStorage.removeItem('copiedBlockTime');

    console.log('Unified clipboard: Clipboard cleared');
  };

  const hasCopiedMateria = (): boolean => copiedMateria !== null;
  const hasCopiedBlock = (): boolean => copiedBlock !== null;

  const getSourceInfo = () => {
    if (copiedMateria) {
      const contextLabel = copiedMateria.source_context === 'general_schedule' ? 'Espelho Geral' : 'espelho aberto';
      return {
        type: 'materia' as const,
        context: copiedMateria.source_context,
        contextLabel,
        telejornal: copiedMateria.source_telejornal,
        bloco: copiedMateria.source_bloco_nome,
        item: copiedMateria.retranca
      };
    }

    if (copiedBlock) {
      const contextLabel = copiedBlock.source_context === 'general_schedule' ? 'Espelho Geral' : 'espelho aberto';
      return {
        type: 'block' as const,
        context: copiedBlock.source_context,
        contextLabel,
        item: copiedBlock.nome,
        materias: copiedBlock.materias.length
      };
    }

    return null;
  };

  return {
    copiedMateria,
    copiedBlock,
    copyMateria,
    copyBlock,
    clearClipboard,
    hasCopiedMateria,
    hasCopiedBlock,
    getSourceInfo
  };
};