
import { SaveModelModal } from "@/components/models/SaveModelModal";
import { SavedModelsModal } from "@/components/models/SavedModelsModal";
import { SavedModel } from "@/services/models-api";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface NewsScheduleModalsProps {
  selectedJournal: string | null;
  isSaveModelModalOpen: boolean;
  setIsSaveModelModalOpen: (open: boolean) => void;
  isSavedModelsModalOpen: boolean;
  setIsSavedModelsModalOpen: (open: boolean) => void;
}

export const NewsScheduleModals = ({
  selectedJournal,
  isSaveModelModalOpen,
  setIsSaveModelModalOpen,
  isSavedModelsModalOpen,
  setIsSavedModelsModalOpen
}: NewsScheduleModalsProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  return (
    <>
      {selectedJournal && (
        <SaveModelModal
          isOpen={isSaveModelModalOpen}
          onClose={() => setIsSaveModelModalOpen(false)}
          telejornalId={selectedJournal}
        />
      )}
      
      <SavedModelsModal
        isOpen={isSavedModelsModalOpen}
        onClose={() => setIsSavedModelsModalOpen(false)}
        onUseModel={handleUseModel}
        telejornalId={selectedJournal}
        onModelApplied={handleModelApplied}
      />
    </>
  );
};
