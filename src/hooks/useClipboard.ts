
import { useState, useEffect } from 'react';
import { Materia } from '@/types';
import { toast } from '@/hooks/use-toast';

const CLIPBOARD_STORAGE_KEY = 'copiedMateria';
const CLIPBOARD_TIMESTAMP_KEY = 'copiedMateriaTimestamp';
const BLOCK_CLIPBOARD_STORAGE_KEY = 'copiedBlock';
const BLOCK_CLIPBOARD_TIMESTAMP_KEY = 'copiedBlockTimestamp';
const CLIPBOARD_EXPIRY_HOURS = 24;

interface CopiedBlock {
  id: string;
  nome: string;
  ordem: number;
  materias: Materia[];
  is_copied_block: true;
}

interface ClipboardState {
  type: 'materia' | 'block' | null;
  timestamp: number;
  data: Materia | CopiedBlock | null;
}

export const useClipboard = () => {
  const [copiedMateria, setCopiedMateria] = useState<Materia | null>(null);
  const [copiedBlock, setCopiedBlock] = useState<CopiedBlock | null>(null);
  const [clipboardState, setClipboardState] = useState<ClipboardState>({
    type: null,
    timestamp: 0,
    data: null
  });
  const [isOperationInProgress, setIsOperationInProgress] = useState(false);

  // Sincronizar com sessionStorage e detectar mudanças entre abas
  useEffect(() => {
    const loadStoredData = () => {
      try {
        console.log('🔄 Carregando dados do clipboard...');
        
        const storedMateria = sessionStorage.getItem(CLIPBOARD_STORAGE_KEY);
        const storedMateriaTimestamp = sessionStorage.getItem(CLIPBOARD_TIMESTAMP_KEY);
        const storedBlock = sessionStorage.getItem(BLOCK_CLIPBOARD_STORAGE_KEY);
        const storedBlockTimestamp = sessionStorage.getItem(BLOCK_CLIPBOARD_TIMESTAMP_KEY);

        let materiaData = null;
        let materiaTimestamp = 0;
        let blockData = null;
        let blockTimestamp = 0;

        // Carregar dados da matéria se válidos
        if (storedMateria && storedMateriaTimestamp) {
          const timestamp = parseInt(storedMateriaTimestamp);
          const now = Date.now();
          const expiryTime = CLIPBOARD_EXPIRY_HOURS * 60 * 60 * 1000;
          
          if (now - timestamp < expiryTime) {
            materiaData = JSON.parse(storedMateria);
            materiaTimestamp = timestamp;
            console.log('✅ Matéria recuperada:', materiaData.retranca, 'timestamp:', materiaTimestamp);
          } else {
            sessionStorage.removeItem(CLIPBOARD_STORAGE_KEY);
            sessionStorage.removeItem(CLIPBOARD_TIMESTAMP_KEY);
            console.log('🕐 Matéria expirada, removendo...');
          }
        }

        // Carregar dados do bloco se válidos
        if (storedBlock && storedBlockTimestamp) {
          const timestamp = parseInt(storedBlockTimestamp);
          const now = Date.now();
          const expiryTime = CLIPBOARD_EXPIRY_HOURS * 60 * 60 * 1000;
          
          if (now - timestamp < expiryTime) {
            blockData = JSON.parse(storedBlock);
            blockTimestamp = timestamp;
            console.log('✅ Bloco recuperado:', blockData.nome, 'timestamp:', blockTimestamp);
          } else {
            sessionStorage.removeItem(BLOCK_CLIPBOARD_STORAGE_KEY);
            sessionStorage.removeItem(BLOCK_CLIPBOARD_TIMESTAMP_KEY);
            console.log('🕐 Bloco expirado, removendo...');
          }
        }

        // Determinar qual foi copiado mais recentemente
        if (materiaData && blockData) {
          if (materiaTimestamp > blockTimestamp) {
            console.log('📋 Priorizando matéria (mais recente)');
            setCopiedMateria(materiaData);
            setCopiedBlock(null);
            setClipboardState({ type: 'materia', timestamp: materiaTimestamp, data: materiaData });
          } else {
            console.log('📋 Priorizando bloco (mais recente)');
            setCopiedMateria(null);
            setCopiedBlock(blockData);
            setClipboardState({ type: 'block', timestamp: blockTimestamp, data: blockData });
          }
        } else if (materiaData) {
          console.log('📋 Apenas matéria disponível');
          setCopiedMateria(materiaData);
          setCopiedBlock(null);
          setClipboardState({ type: 'materia', timestamp: materiaTimestamp, data: materiaData });
        } else if (blockData) {
          console.log('📋 Apenas bloco disponível');
          setCopiedMateria(null);
          setCopiedBlock(blockData);
          setClipboardState({ type: 'block', timestamp: blockTimestamp, data: blockData });
        } else {
          console.log('📋 Nenhum dado no clipboard');
          setCopiedMateria(null);
          setCopiedBlock(null);
          setClipboardState({ type: null, timestamp: 0, data: null });
        }
      } catch (error) {
        console.error('❌ Erro ao recuperar dados do clipboard:', error);
        // Limpar dados corrompidos
        sessionStorage.removeItem(CLIPBOARD_STORAGE_KEY);
        sessionStorage.removeItem(CLIPBOARD_TIMESTAMP_KEY);
        sessionStorage.removeItem(BLOCK_CLIPBOARD_STORAGE_KEY);
        sessionStorage.removeItem(BLOCK_CLIPBOARD_TIMESTAMP_KEY);
        setCopiedMateria(null);
        setCopiedBlock(null);
        setClipboardState({ type: null, timestamp: 0, data: null });
      }
    };

    // Carregar na inicialização
    loadStoredData();

    // Listener para mudanças no storage (entre abas)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CLIPBOARD_STORAGE_KEY || 
          e.key === CLIPBOARD_TIMESTAMP_KEY ||
          e.key === BLOCK_CLIPBOARD_STORAGE_KEY || 
          e.key === BLOCK_CLIPBOARD_TIMESTAMP_KEY) {
        console.log('🔄 Mudança detectada no storage, recarregando...');
        setTimeout(loadStoredData, 100); // Pequeno delay para garantir consistência
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Operação atômica para copiar matéria
  const copyMateria = async (materia: Materia) => {
    if (isOperationInProgress) {
      console.log('⏳ Operação em andamento, ignorando...');
      return;
    }

    setIsOperationInProgress(true);
    
    try {
      const timestamp = Date.now();
      console.log('📋 Copiando matéria:', materia.retranca, 'timestamp:', timestamp);

      // Operação atômica - definir todos os estados juntos
      setCopiedMateria(materia);
      setCopiedBlock(null);
      setClipboardState({ type: 'materia', timestamp, data: materia });
      
      // Salvar no sessionStorage
      sessionStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(materia));
      sessionStorage.setItem(CLIPBOARD_TIMESTAMP_KEY, timestamp.toString());
      
      const camposPreenchidos = Object.values(materia).filter(valor => 
        valor !== null && valor !== undefined && valor !== ''
      ).length;

      toast({
        title: "Matéria copiada",
        description: `"${materia.retranca}" copiada com ${camposPreenchidos} campos. Use Ctrl+V para colar.`,
      });

      console.log('✅ Matéria copiada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao copiar matéria:', error);
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar a matéria",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setIsOperationInProgress(false), 200);
    }
  };

  // Operação atômica para copiar bloco
  const copyBlock = async (block: any, materias: Materia[]) => {
    if (isOperationInProgress) {
      console.log('⏳ Operação em andamento, ignorando...');
      return;
    }

    setIsOperationInProgress(true);
    
    try {
      const timestamp = Date.now();
      console.log('📋 Copiando bloco:', block.nome, 'com', materias.length, 'matérias, timestamp:', timestamp);

      const copiedBlockData: CopiedBlock = {
        id: block.id,
        nome: block.nome,
        ordem: block.ordem,
        materias: materias,
        is_copied_block: true
      };

      // Operação atômica - definir todos os estados juntos
      setCopiedBlock(copiedBlockData);
      setCopiedMateria(null);
      setClipboardState({ type: 'block', timestamp, data: copiedBlockData });
      
      // Salvar no sessionStorage
      sessionStorage.setItem(BLOCK_CLIPBOARD_STORAGE_KEY, JSON.stringify(copiedBlockData));
      sessionStorage.setItem(BLOCK_CLIPBOARD_TIMESTAMP_KEY, timestamp.toString());

      const totalDuracao = materias.reduce((sum, m) => sum + (m.duracao || 0), 0);
      const minutos = Math.floor(totalDuracao / 60);
      const segundos = totalDuracao % 60;

      toast({
        title: "Bloco copiado",
        description: `"${block.nome}" copiado com ${materias.length} matérias (${minutos}:${segundos.toString().padStart(2, '0')}). Use Ctrl+V para colar.`,
      });

      console.log('✅ Bloco copiado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao copiar bloco:', error);
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o bloco",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setIsOperationInProgress(false), 200);
    }
  };

  const clearClipboard = () => {
    console.log('🗑️ Limpando clipboard');
    setCopiedMateria(null);
    setCopiedBlock(null);
    setClipboardState({ type: null, timestamp: 0, data: null });
    sessionStorage.removeItem(CLIPBOARD_STORAGE_KEY);
    sessionStorage.removeItem(CLIPBOARD_TIMESTAMP_KEY);
    sessionStorage.removeItem(BLOCK_CLIPBOARD_STORAGE_KEY);
    sessionStorage.removeItem(BLOCK_CLIPBOARD_TIMESTAMP_KEY);
    setIsOperationInProgress(false);
  };

  const hasCopiedMateria = () => clipboardState.type === 'materia' && copiedMateria !== null;
  const hasCopiedBlock = () => clipboardState.type === 'block' && copiedBlock !== null;

  const checkStoredMateria = () => {
    try {
      const storedMateria = sessionStorage.getItem(CLIPBOARD_STORAGE_KEY);
      const storedTimestamp = sessionStorage.getItem(CLIPBOARD_TIMESTAMP_KEY);
      
      if (storedMateria && storedTimestamp) {
        const timestamp = parseInt(storedTimestamp);
        const now = Date.now();
        const expiryTime = CLIPBOARD_EXPIRY_HOURS * 60 * 60 * 1000;
        
        return now - timestamp < expiryTime;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Função para obter informações do clipboard atual
  const getClipboardInfo = () => {
    return {
      type: clipboardState.type,
      timestamp: clipboardState.timestamp,
      hasMateria: hasCopiedMateria(),
      hasBlock: hasCopiedBlock(),
      data: clipboardState.data
    };
  };

  return {
    copiedMateria,
    copiedBlock,
    copyMateria,
    copyBlock,
    clearClipboard,
    hasCopiedMateria,
    hasCopiedBlock,
    checkStoredMateria,
    isOperationInProgress,
    getClipboardInfo,
    clipboardState
  };
};
