
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  saveRundownSnapshot, 
  fetchLastSavedRundown, 
  fetchSavedRundownsByDate,
  fetchSavedRundown,
  SavedRundown,
  SavedRundownDisplay 
} from "@/services/saved-rundowns-api";
import { Bloco, Materia } from "@/types";

export const useSavedRundowns = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [savedRundowns, setSavedRundowns] = useState<SavedRundownDisplay[]>([]);
  const [lastRundown, setLastRundown] = useState<SavedRundown | null>(null);
  const { toast } = useToast();

  const saveRundown = useCallback(async (
    telejornalId: string,
    telejornalNome: string,
    blocks: (Bloco & { items: Materia[], totalTime: number })[]
  ) => {
    try {
      setIsLoading(true);
      const savedRundown = await saveRundownSnapshot(telejornalId, telejornalNome, blocks);
      toast({
        title: "Espelho salvo",
        description: `Espelho de ${telejornalNome} salvo com sucesso`,
      });
      return savedRundown;
    } catch (error) {
      console.error("Erro ao salvar espelho:", error);
      toast({
        title: "Erro ao salvar espelho",
        description: "Não foi possível salvar o espelho",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const loadLastRundown = useCallback(async (telejornalId: string) => {
    try {
      setIsLoading(true);
      const rundown = await fetchLastSavedRundown(telejornalId);
      setLastRundown(rundown);
      return rundown;
    } catch (error) {
      console.error("Erro ao carregar último espelho:", error);
      toast({
        title: "Erro ao carregar espelho",
        description: "Não foi possível carregar o último espelho",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const loadSavedRundownsByDate = useCallback(async (
    telejornalId?: string,
    selectedDate?: Date
  ) => {
    try {
      setIsLoading(true);
      const rundowns = await fetchSavedRundownsByDate(telejornalId, selectedDate);
      setSavedRundowns(rundowns);
      return rundowns;
    } catch (error) {
      console.error("Erro ao carregar espelhos por data:", error);
      toast({
        title: "Erro ao carregar espelhos",
        description: "Não foi possível carregar os espelhos por data",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const loadSavedRundown = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const rundown = await fetchSavedRundown(id);
      return rundown;
    } catch (error) {
      console.error("Erro ao carregar espelho salvo:", error);
      toast({
        title: "Erro ao carregar espelho",
        description: "Não foi possível carregar o espelho salvo",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    isLoading,
    savedRundowns,
    lastRundown,
    saveRundown,
    loadLastRundown,
    loadSavedRundownsByDate,
    loadSavedRundown
  };
};
