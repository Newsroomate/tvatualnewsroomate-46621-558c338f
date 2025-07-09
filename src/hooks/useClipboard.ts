
import { useState, useEffect } from 'react';
import { Materia } from '@/types';
import { toast } from '@/hooks/use-toast';

const CLIPBOARD_STORAGE_KEY = 'newsroom_clipboard';
const CLIPBOARD_EXPIRY_HOURS = 24;

interface ClipboardItem {
  type: 'materia' | 'block';
  data: any;
  timestamp: number;
  id: string;
  user_session: string;
}

interface CopiedBlock {
  id: string;
  nome: string;
  ordem: number;
  materias: Materia[];
  is_copied_block: true;
}

// Gerar ID único para a sessão do usuário
const getUserSessionId = () => {
  let sessionId = sessionStorage.getItem('user_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('user_session_id', sessionId);
  }
  return sessionId;
};

export const useClipboard = () => {
  const [clipboardItem, setClipboardItem] = useState<ClipboardItem | null>(null);
  const userSessionId = getUserSessionId();

  // Carregar dados do clipboard uma única vez na inicialização
  useEffect(() => {
    const loadClipboardData = () => {
      try {
        const storedData = sessionStorage.getItem(CLIPBOARD_STORAGE_KEY);
        if (!storedData) return;

        const parsedData: ClipboardItem = JSON.parse(storedData);
        
        // Verificar se o item não expirou
        const now = Date.now();
        const expiryTime = CLIPBOARD_EXPIRY_HOURS * 60 * 60 * 1000;
        
        if (now - parsedData.timestamp < expiryTime) {
          setClipboardItem(parsedData);
          console.log('Clipboard recuperado:', {
            type: parsedData.type,
            timestamp: new Date(parsedData.timestamp).toLocaleTimeString(),
            session: parsedData.user_session,
            currentSession: userSessionId
          });
        } else {
          // Limpar dados expirados
          sessionStorage.removeItem(CLIPBOARD_STORAGE_KEY);
        }
      } catch (error) {
        console.error('Erro ao recuperar clipboard:', error);
        sessionStorage.removeItem(CLIPBOARD_STORAGE_KEY);
      }
    };

    loadClipboardData();
  }, [userSessionId]);

  // Função para salvar no storage com controle de concorrência
  const saveToStorage = (item: ClipboardItem) => {
    try {
      // Implementar debounce simples para evitar escritas simultâneas
      setTimeout(() => {
        sessionStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(item));
      }, 50);
    } catch (error) {
      console.error('Erro ao salvar no clipboard:', error);
      toast({
        title: "Aviso sobre persistência",
        description: "O item foi copiado mas pode não persistir entre sessões",
        variant: "destructive"
      });
    }
  };

  const copyMateria = (materia: Materia) => {
    const clipboardId = `materia_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('Copiando matéria para clipboard unificado:', {
      id: materia.id,
      retranca: materia.retranca,
      clipboardId,
      session: userSessionId,
      timestamp: new Date().toLocaleTimeString()
    });

    const newClipboardItem: ClipboardItem = {
      type: 'materia',
      data: materia,
      timestamp: Date.now(),
      id: clipboardId,
      user_session: userSessionId
    };

    setClipboardItem(newClipboardItem);
    saveToStorage(newClipboardItem);

    const camposPreenchidos = Object.values(materia).filter(valor => 
      valor !== null && valor !== undefined && valor !== ''
    ).length;

    toast({
      title: "✅ Matéria copiada",
      description: `"${materia.retranca}" copiada com ${camposPreenchidos} campos. Use Ctrl+V para colar.`,
    });
  };

  const copyBlock = (block: any, materias: Materia[]) => {
    const clipboardId = `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('Copiando bloco para clipboard unificado:', {
      id: block.id,
      nome: block.nome,
      totalMaterias: materias.length,
      clipboardId,
      session: userSessionId,
      timestamp: new Date().toLocaleTimeString()
    });

    const copiedBlockData: CopiedBlock = {
      id: block.id,
      nome: block.nome,
      ordem: block.ordem,
      materias: materias,
      is_copied_block: true
    };

    const newClipboardItem: ClipboardItem = {
      type: 'block',
      data: copiedBlockData,
      timestamp: Date.now(),
      id: clipboardId,
      user_session: userSessionId
    };

    setClipboardItem(newClipboardItem);
    saveToStorage(newClipboardItem);

    const totalDuracao = materias.reduce((sum, m) => sum + (m.duracao || 0), 0);
    const minutos = Math.floor(totalDuracao / 60);
    const segundos = totalDuracao % 60;

    toast({
      title: "✅ Bloco copiado",
      description: `Bloco "${block.nome}" copiado com ${materias.length} matérias (${minutos}:${segundos.toString().padStart(2, '0')}). Use Ctrl+V para colar.`,
    });
  };

  const clearClipboard = () => {
    console.log('Limpando clipboard unificado:', {
      session: userSessionId,
      previousItem: clipboardItem?.type
    });
    
    setClipboardItem(null);
    sessionStorage.removeItem(CLIPBOARD_STORAGE_KEY);
  };

  // Getters para compatibilidade com código existente
  const copiedMateria = clipboardItem?.type === 'materia' ? clipboardItem.data : null;
  const copiedBlock = clipboardItem?.type === 'block' ? clipboardItem.data : null;

  const hasCopiedMateria = () => clipboardItem?.type === 'materia';
  const hasCopiedBlock = () => clipboardItem?.type === 'block';

  const getClipboardInfo = () => {
    if (!clipboardItem) return null;
    
    return {
      type: clipboardItem.type,
      timestamp: clipboardItem.timestamp,
      age: Date.now() - clipboardItem.timestamp,
      session: clipboardItem.user_session,
      isOwnSession: clipboardItem.user_session === userSessionId,
      itemName: clipboardItem.type === 'materia' 
        ? clipboardItem.data.retranca 
        : clipboardItem.data.nome
    };
  };

  return {
    // Estados principais
    copiedMateria,
    copiedBlock,
    clipboardItem,
    
    // Funções principais
    copyMateria,
    copyBlock,
    clearClipboard,
    
    // Verificadores
    hasCopiedMateria,
    hasCopiedBlock,
    
    // Informações de debug
    getClipboardInfo,
    
    // Para compatibilidade
    checkStoredMateria: hasCopiedMateria
  };
};
