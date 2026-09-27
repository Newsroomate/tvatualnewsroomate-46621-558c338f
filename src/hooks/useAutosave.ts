import { useEffect, useRef, useState, useCallback } from "react";

interface UseAutosaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  enabled?: boolean;
  intervalMs?: number;
}

/**
 * Salvamento automático periódico.
 * Só grava quando há alteração pendente em relação à última versão salva.
 */
export function useAutosave<T>({
  data,
  onSave,
  enabled = true,
  intervalMs = 15000,
}: UseAutosaveOptions<T>) {
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const dataRef = useRef(data);
  const onSaveRef = useRef(onSave);
  const enabledRef = useRef(enabled);
  const lastSavedSnapshotRef = useRef<string | null>(null);
  const savingRef = useRef(false);

  dataRef.current = data;
  onSaveRef.current = onSave;
  enabledRef.current = enabled;

  const snapshot = (value: unknown) => {
    try {
      return JSON.stringify(value);
    } catch {
      return null;
    }
  };

  // Guarda a versão inicial para não gravar logo de cara sem alteração
  useEffect(() => {
    if (lastSavedSnapshotRef.current === null) {
      lastSavedSnapshotRef.current = snapshot(dataRef.current);
    }
  }, []);

  const saveNow = useCallback(async () => {
    if (!enabledRef.current || savingRef.current) return;

    const current = snapshot(dataRef.current);
    if (current === null || current === lastSavedSnapshotRef.current) return;

    savingRef.current = true;
    setIsAutosaving(true);
    try {
      await onSaveRef.current(dataRef.current);
      lastSavedSnapshotRef.current = current;
      setLastSavedAt(new Date());
    } catch (error) {
      console.error("[useAutosave] Falha no salvamento automático:", error);
    } finally {
      savingRef.current = false;
      setIsAutosaving(false);
    }
  }, []);

  // Marca externamente que o conteúdo atual já está salvo (ex.: salvamento manual)
  const markSaved = useCallback(() => {
    lastSavedSnapshotRef.current = snapshot(dataRef.current);
    setLastSavedAt(new Date());
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      void saveNow();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs, saveNow]);

  // Tentativa final ao desmontar / fechar a aba
  useEffect(() => {
    const handleBeforeUnload = () => {
      void saveNow();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      void saveNow();
    };
  }, [saveNow]);

  return { isAutosaving, lastSavedAt, saveNow, markSaved };
}
