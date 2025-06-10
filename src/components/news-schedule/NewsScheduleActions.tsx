
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { SavedModel } from "@/services/models-api";
import { Bloco, Materia, Telejornal } from "@/types";

type BlockWithItems = Bloco & { 
  items: Materia[];
  totalTime: number;
};

interface NewsScheduleActionsProps {
  selectedJournal: string | null;
  currentTelejornal: Telejornal | null;
  blocks: BlockWithItems[];
  journalPrefix: string;
  openTeleprompter: (blocks: BlockWithItems[], telejornal: Telejornal | null) => void;
  handleDragEnd: (result: any) => void;
  onSetSaveModelModalOpen: (open: boolean) => void;
  onSetSavedModelsModalOpen: (open: boolean) => void;
}

export const useNewsScheduleActions = ({
  selectedJournal,
  currentTelejornal,
  blocks,
  journalPrefix,
  openTeleprompter,
  handleDragEnd,
  onSetSaveModelModalOpen,
  onSetSavedModelsModalOpen
}: NewsScheduleActionsProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleViewTeleprompter = () => {
    console.log(`[${journalPrefix}] Opening teleprompter with blocks:`, blocks);
    openTeleprompter(blocks, currentTelejornal);
  };

  const handleDragEndWithLogging = (result: any) => {
    console.log(`[${journalPrefix}] Handling drag end:`, result);
    handleDragEnd(result);
  };

  const handleSaveModel = () => {
    if (!selectedJournal) {
      toast({
        title: "Erro",
        description: "Nenhum telejornal selecionado",
        variant: "destructive"
      });
      return;
    }

    if (!blocks || blocks.length === 0) {
      toast({
        title: "Nenhuma estrutura para salvar",
        description: "Adicione blocos e matérias antes de salvar como modelo",
        variant: "destructive"
      });
      return;
    }

    onSetSaveModelModalOpen(true);
  };

  const handleUseModel = (model: SavedModel) => {
    toast({
      title: "Modelo aplicado",
      description: "O espelho foi atualizado com a estrutura do modelo",
    });
  };

  const handleModelApplied = () => {
    // Force immediate refresh of blocks and materias data
    if (selectedJournal) {
      console.log("Forcing data refresh after model application");
      
      // Invalidate all related queries to force immediate refetch
      queryClient.invalidateQueries({ queryKey: ["blocos", selectedJournal] });
      queryClient.invalidateQueries({ queryKey: ["materias"] });
      
      // Refetch queries immediately
      queryClient.refetchQueries({ queryKey: ["blocos", selectedJournal] });
    }
  };

  const handleViewSavedModels = () => {
    onSetSavedModelsModalOpen(true);
  };

  return {
    handleViewTeleprompter,
    handleDragEndWithLogging,
    handleSaveModel,
    handleUseModel,
    handleModelApplied,
    handleViewSavedModels
  };
};
