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
        // Load materia
        const storedMateria = sessionStorage.getItem('copiedMateria');
        const storedMateriaTime = sessionStorage.getItem('copiedMateriaTime');
        
        console.log('Unified clipboard: Loading data from storage:', {
          hasMateria: !!storedMateria,
          hasTime: !!storedMateriaTime,
          timestamp: storedMateriaTime
        });
        
        if (storedMateria && storedMateriaTime) {
          const timestamp = parseInt(storedMateriaTime);
          const timeElapsed = Date.now() - timestamp;
          
          console.log('Unified clipboard: Time check:', {
            timeElapsed,
            expiry: CLIPBOARD_EXPIRY,
            isValid: timeElapsed < CLIPBOARD_EXPIRY
          });
          
          if (timeElapsed < CLIPBOARD_EXPIRY) {
            const materiaData = JSON.parse(storedMateria);
            setCopiedMateria(materiaData);
            console.log('Unified clipboard: Matéria loaded from storage:', {
              retranca: materiaData.retranca,
              context: materiaData.source_context,
              allData: materiaData
            });
          } else {
            console.log('Unified clipboard: Data expired, removing from storage');
            sessionStorage.removeItem('copiedMateria');
            sessionStorage.removeItem('copiedMateriaTime');
            setCopiedMateria(null);
          }
        } else {
          console.log('Unified clipboard: No materia data in storage');
          setCopiedMateria(null);
        }

        // Load block
        const storedBlock = sessionStorage.getItem('copiedBlock');
        const storedBlockTime = sessionStorage.getItem('copiedBlockTime');
        
        if (storedBlock && storedBlockTime) {
          const timestamp = parseInt(storedBlockTime);
          if (Date.now() - timestamp < CLIPBOARD_EXPIRY) {
            const blockData = JSON.parse(storedBlock);
            setCopiedBlock(blockData);
            console.log('Unified clipboard: Bloco loaded from storage:', blockData.nome);
          } else {
            sessionStorage.removeItem('copiedBlock');
            sessionStorage.removeItem('copiedBlockTime');
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados do clipboard:', error);
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
    console.log('Unified clipboard: Copiando matéria:', {
      retranca: materia.retranca,
      context,
      telejornal: telejornalNome,
      bloco: blocoNome,
      allFields: Object.keys(materia)
    });

    const materiaWithContext: CopiedMateriaExtended = {
      ...materia,
      source_context: context,
      source_telejornal: telejornalNome,
      source_bloco_nome: blocoNome
    };

    setCopiedMateria(materiaWithContext);
    setCopiedBlock(null); // Clear any copied block

    // Save to sessionStorage
    try {
      const materiaString = JSON.stringify(materiaWithContext);
      sessionStorage.setItem('copiedMateria', materiaString);
      sessionStorage.setItem('copiedMateriaTime', Date.now().toString());
      sessionStorage.removeItem('copiedBlock');
      sessionStorage.removeItem('copiedBlockTime');
      
      console.log('Unified clipboard: Matéria salva no sessionStorage:', {
        size: materiaString.length + ' chars',
        timestamp: Date.now()
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
    console.log('Unified clipboard: Copiando bloco:', {
      nome: block.nome,
      materiasCount: materias.length,
      context,
      totalMateriaFields: materias.reduce((sum, m) => sum + Object.keys(m).length, 0)
    });

    const blockWithContext: CopiedBlock = {
      id: block.id,
      nome: block.nome,
      ordem: block.ordem,
      materias: materias,
      is_copied_block: true,
      source_context: context
    };

    setCopiedBlock(blockWithContext);
    setCopiedMateria(null); // Clear any copied materia

    // Save to sessionStorage
    try {
      const blockString = JSON.stringify(blockWithContext);
      sessionStorage.setItem('copiedBlock', blockString);
      sessionStorage.setItem('copiedBlockTime', Date.now().toString());
      sessionStorage.removeItem('copiedMateria');
      sessionStorage.removeItem('copiedMateriaTime');
      
      console.log('Unified clipboard: Bloco salvo no sessionStorage:', {
        size: blockString.length + ' chars',
        timestamp: Date.now()
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