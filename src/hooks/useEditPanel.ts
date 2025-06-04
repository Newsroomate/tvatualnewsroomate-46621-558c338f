
import { useState } from "react";
import { Materia, Telejornal } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { QueryClient } from "@tanstack/react-query";

interface UseEditPanelProps {
  currentTelejornal: Telejornal | null;
  selectedJournal: string | null;
  queryClient: QueryClient;
}

export const useEditPanel = ({
  currentTelejornal,
  selectedJournal,
  queryClient
}: UseEditPanelProps) => {
  const [selectedItem, setSelectedItem] = useState<Materia | null>(null);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const { toast } = useToast();

  const handleEditItem = (item: Materia) => {
    if (!currentTelejornal?.espelho_aberto) {
      toast({
        title: "Espelho fechado",
        description: "Você precisa abrir o espelho para editar matérias.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedItem(item);
    setIsEditPanelOpen(true);
  };

  const handleCloseEditPanel = () => {
    setIsEditPanelOpen(false);
    setSelectedItem(null);
    
    // Explicitly invalidate queries to force a refresh of the data
    // This ensures that even if realtime updates fail, we still get fresh data
    if (selectedJournal) {
      console.log("Explicitly invalidating queries to refresh data");
      queryClient.invalidateQueries({ queryKey: ['blocos', selectedJournal] });
    }
    
    console.log("Edit panel closed - UI will update via Realtime subscription and explicit query invalidation");
  };

  return {
    selectedItem,
    isEditPanelOpen,
    setIsEditPanelOpen,
    handleEditItem,
    handleCloseEditPanel,
  };
};
