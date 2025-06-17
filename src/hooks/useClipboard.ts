
import { useState, useEffect } from 'react';
import { Materia } from '@/types';
import { toast } from '@/hooks/use-toast';

const CLIPBOARD_STORAGE_KEY = 'copiedMateria';
const CLIPBOARD_TIMESTAMP_KEY = 'copiedMateriaTimestamp';
const CLIPBOARD_EXPIRY_HOURS = 24; // Matéria copiada expira em 24 horas

export const useClipboard = () => {
  const [copiedMateria, setCopiedMateria] = useState<Materia | null>(null);

  // Verificar se há matéria copiada no sessionStorage ao inicializar
  useEffect(() => {
    const loadStoredMateria = () => {
      try {
        const storedMateria = sessionStorage.getItem(CLIPBOARD_STORAGE_KEY);
        const storedTimestamp = sessionStorage.getItem(CLIPBOARD_TIMESTAMP_KEY);
        
        if (storedMateria && storedTimestamp) {
          const timestamp = parseInt(storedTimestamp);
          const now = Date.now();
          const expiryTime = CLIPBOARD_EXPIRY_HOURS * 60 * 60 * 1000; // 24 horas em ms
          
          // Verificar se a matéria copiada ainda é válida (não expirou)
          if (now - timestamp < expiryTime) {
            const parsedMateria = JSON.parse(storedMateria);
            setCopiedMateria(parsedMateria);
            console.log('Matéria copiada recuperada do sessionStorage:', {
              retranca: parsedMateria.retranca,
              tempoArmazenado: Math.round((now - timestamp) / (1000 * 60)) + ' minutos',
              totalCampos: Object.keys(parsedMateria).length
            });
          } else {
            // Matéria expirou, limpar storage
            console.log('Matéria copiada expirou, limpando storage');
            sessionStorage.removeItem(CLIPBOARD_STORAGE_KEY);
            sessionStorage.removeItem(CLIPBOARD_TIMESTAMP_KEY);
          }
        }
      } catch (error) {
        console.error('Erro ao recuperar matéria copiada do sessionStorage:', error);
        sessionStorage.removeItem(CLIPBOARD_STORAGE_KEY);
        sessionStorage.removeItem(CLIPBOARD_TIMESTAMP_KEY);
      }
    };

    loadStoredMateria();

    // Verificar storage periodicamente para sincronizar entre abas
    const interval = setInterval(loadStoredMateria, 1000);

    return () => clearInterval(interval);
  }, []);

  const copyMateria = (materia: Materia) => {
    console.log('Copiando matéria para clipboard global com persistência aprimorada:', {
      id: materia.id,
      retranca: materia.retranca,
      totalCampos: Object.keys(materia).length,
      camposImportantes: {
        texto: !!materia.texto,
        duracao: materia.duracao,
        reporter: !!materia.reporter,
        clip: !!materia.clip,
        pagina: !!materia.pagina,
        cabeca: !!materia.cabeca,
        gc: !!materia.gc,
        status: !!materia.status,
        tipo_material: !!materia.tipo_material
      }
    });

    setCopiedMateria(materia);
    
    // Persistir no sessionStorage com timestamp para controle de expiração
    try {
      const timestamp = Date.now();
      sessionStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(materia));
      sessionStorage.setItem(CLIPBOARD_TIMESTAMP_KEY, timestamp.toString());
      console.log('Matéria salva no sessionStorage com timestamp:', new Date(timestamp).toLocaleString());
    } catch (error) {
      console.error('Erro ao salvar matéria no sessionStorage:', error);
      toast({
        title: "Aviso sobre persistência",
        description: "A matéria foi copiada mas pode não persistir entre sessões",
        variant: "destructive"
      });
    }

    // Contar campos preenchidos para o toast
    const camposPreenchidos = Object.values(materia).filter(valor => 
      valor !== null && valor !== undefined && valor !== ''
    ).length;

    toast({
      title: "Matéria copiada com sucesso",
      description: `"${materia.retranca}" foi copiada com ${camposPreenchidos} campos preservados. Use Ctrl+V para colar no espelho atual.`,
    });
  };

  const clearClipboard = () => {
    console.log('Limpando clipboard e storage');
    setCopiedMateria(null);
    sessionStorage.removeItem(CLIPBOARD_STORAGE_KEY);
    sessionStorage.removeItem(CLIPBOARD_TIMESTAMP_KEY);
  };

  const hasCopiedMateria = () => {
    return copiedMateria !== null;
  };

  // Função para verificar se há matéria no storage sem carregar o estado
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

  return {
    copiedMateria,
    copyMateria,
    clearClipboard,
    hasCopiedMateria,
    checkStoredMateria
  };
};
