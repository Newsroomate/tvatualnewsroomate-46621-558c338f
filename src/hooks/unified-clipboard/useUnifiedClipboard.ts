import { useState, useEffect } from 'react';
import { Materia } from '@/types';
import { toast } from '@/hooks/use-toast';
import { 
  ClipboardState, 
  CopiedBlock, 
  UseUnifiedClipboardProps,
  PasteOperationResult
} from './types';
import { saveToStorage, loadFromStorage, clearStorage } from './storage';
import { 
  validateMateriaForCopy, 
  validateBlockForCopy, 
  validateMateriaForPaste, 
  validateBlockForPaste 
} from './validation';
import { executeMateriaImpast } from './materia-operations';
import { executeBlockPaste } from './block-operations';
import { logCopyMateria, logCopyBlock } from './logger';

export const useUnifiedClipboard = (props: UseUnifiedClipboardProps = {}) => {
  const {
    blocks,
    setBlocks,
    selectedMateria,
    selectedJournal,
    currentTelejornal,
    refreshBlocks,
    markOptimisticUpdate
  } = props;

  const [clipboardState, setClipboardState] = useState<ClipboardState>({
    type: null,
    copiedMateria: null,
    copiedBlock: null,
    timestamp: 0
  });

  // Carregar estado do storage ao inicializar
  useEffect(() => {
    const loadStoredData = () => {
      const stored = loadFromStorage();
      if (stored) {
        setClipboardState(stored);
        console.log('Clipboard carregado do storage:', {
          type: stored.type,
          hasMateria: !!stored.copiedMateria,
          hasBlock: !!stored.copiedBlock,
          age: Math.round((Date.now() - stored.timestamp) / (1000 * 60)) + ' minutos'
        });
      }
    };

    loadStoredData();
    const interval = setInterval(loadStoredData, 5000); // Verificar a cada 5 segundos
    return () => clearInterval(interval);
  }, []);

  // Função para copiar matéria
  const copyMateria = (materia: Materia) => {
    if (!validateMateriaForCopy(materia)) return;

    const newState: ClipboardState = {
      type: 'materia',
      copiedMateria: materia,
      copiedBlock: null,
      timestamp: Date.now()
    };

    setClipboardState(newState);
    saveToStorage(newState);

    logCopyMateria(materia);

    const camposPreenchidos = Object.values(materia).filter(valor => 
      valor !== null && valor !== undefined && valor !== ''
    ).length;

    toast({
      title: "Matéria copiada",
      description: `"${materia.retranca}" foi copiada com ${camposPreenchidos} campos preservados`,
    });
  };

  // Função para copiar bloco
  const copyBlock = (block: any, materias: Materia[]) => {
    if (!validateBlockForCopy(block, materias)) return;

    const copiedBlockData: CopiedBlock = {
      id: block.id,
      nome: block.nome,
      ordem: block.ordem,
      materias: materias,
      is_copied_block: true,
      source_telejornal: currentTelejornal?.id
    };

    const newState: ClipboardState = {
      type: 'block',
      copiedMateria: null,
      copiedBlock: copiedBlockData,
      timestamp: Date.now()
    };

    setClipboardState(newState);
    saveToStorage(newState);

    logCopyBlock(block, materias.length);

    const totalDuracao = materias.reduce((sum, m) => sum + (m.duracao || 0), 0);
    const minutos = Math.floor(totalDuracao / 60);
    const segundos = totalDuracao % 60;

    toast({
      title: "Bloco copiado",
      description: `Bloco "${block.nome}" foi copiado com ${materias.length} matérias (${minutos}:${segundos.toString().padStart(2, '0')})`,
    });
  };

  // Função para colar (detecta automaticamente o tipo)
  const paste = async (): Promise<PasteOperationResult> => {
    if (clipboardState.type === 'materia' && clipboardState.copiedMateria) {
      return await pasteMateria();
    } else if (clipboardState.type === 'block' && clipboardState.copiedBlock) {
      return await pasteBlock();
    } else {
      toast({
        title: "Nada para colar",
        description: "Copie uma matéria ou bloco primeiro",
        variant: "destructive"
      });
      return {
        success: false,
        message: "Nada para colar"
      };
    }
  };

  // Função para colar matéria
  const pasteMateria = async (): Promise<PasteOperationResult> => {
    if (!validateMateriaForPaste(clipboardState.copiedMateria, blocks || [])) {
      return {
        success: false,
        message: "Validação falhou para colar matéria"
      };
    }

    if (!blocks || !setBlocks) {
      toast({
        title: "Erro de configuração",
        description: "Blocks e setBlocks são necessários para colar matérias",
        variant: "destructive"
      });
      return {
        success: false,
        message: "Configuração incorreta"
      };
    }

    const result = await executeMateriaImpast(
      clipboardState.copiedMateria!,
      blocks,
      setBlocks,
      selectedMateria || null,
      markOptimisticUpdate
    );

    if (result.success) {
      toast({
        title: "Matéria colada",
        description: result.message,
      });
    } else {
      toast({
        title: "Erro ao colar matéria",
        description: result.message,
        variant: "destructive"
      });
    }

    return result;
  };

  // Função para colar bloco
  const pasteBlock = async (): Promise<PasteOperationResult> => {
    if (!validateBlockForPaste(clipboardState.copiedBlock, selectedJournal || null, currentTelejornal)) {
      return {
        success: false,
        message: "Validação falhou para colar bloco"
      };
    }

    const result = await executeBlockPaste(
      clipboardState.copiedBlock!,
      selectedJournal!,
      refreshBlocks
    );

    if (result.success) {
      toast({
        title: "Bloco colado",
        description: result.message,
      });
    } else {
      toast({
        title: "Erro ao colar bloco",
        description: result.message,
        variant: "destructive"
      });
    }

    return result;
  };

  // Função para limpar clipboard
  const clearClipboard = () => {
    setClipboardState({
      type: null,
      copiedMateria: null,
      copiedBlock: null,
      timestamp: 0
    });
    clearStorage();
    
    toast({
      title: "Clipboard limpo",
      description: "Todos os itens copiados foram removidos",
    });
  };

  // Funções de verificação
  const hasCopiedMateria = () => clipboardState.type === 'materia' && !!clipboardState.copiedMateria;
  const hasCopiedBlock = () => clipboardState.type === 'block' && !!clipboardState.copiedBlock;
  const hasAnythingCopied = () => clipboardState.type !== null;

  return {
    // Estado atual
    clipboardType: clipboardState.type,
    copiedMateria: clipboardState.copiedMateria,
    copiedBlock: clipboardState.copiedBlock,
    
    // Ações principais
    copyMateria,
    copyBlock,
    paste,
    pasteMateria,
    pasteBlock,
    clearClipboard,
    
    // Verificações
    hasCopiedMateria,
    hasCopiedBlock,
    hasAnythingCopied,
    
    // Compatibilidade com hooks antigos
    checkStoredMateria: hasCopiedMateria
  };
};