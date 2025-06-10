
import { SaveModelModal } from "@/components/models/SaveModelModal";
import { SavedModelsModal } from "@/components/models/SavedModelsModal";
import { SavedModel } from "@/services/models-api";

interface NewsScheduleModalsProps {
  selectedJournal: string | null;
  isSaveModelModalOpen: boolean;
  isSavedModelsModalOpen: boolean;
  onCloseSaveModel: () => void;
  onCloseSavedModels: () => void;
  onUseModel: (model: SavedModel) => void;
  onModelApplied: () => void;
}

export const NewsScheduleModals = ({
  selectedJournal,
  isSaveModelModalOpen,
  isSavedModelsModalOpen,
  onCloseSaveModel,
  onCloseSavedModels,
  onUseModel,
  onModelApplied
}: NewsScheduleModalsProps) => {
  return (
    <>
      {/* Models Modals */}
      {selectedJournal && (
        <SaveModelModal
          isOpen={isSaveModelModalOpen}
          onClose={onCloseSaveModel}
          telejornalId={selectedJournal}
        />
      )}
      
      <SavedModelsModal
        isOpen={isSavedModelsModalOpen}
        onClose={onCloseSavedModels}
        onUseModel={onUseModel}
        telejornalId={selectedJournal}
        onModelApplied={onModelApplied}
      />
    </>
  );
};
