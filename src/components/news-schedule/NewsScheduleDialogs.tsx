
import { Materia } from "@/types";
import { ConfirmationDialogs } from "./ConfirmationDialogs";
import { NewsScheduleModals } from "./NewsScheduleModals";

interface NewsScheduleDialogsProps {
  selectedJournal: string | null;
  deleteConfirmOpen: boolean;
  setDeleteConfirmOpen: (open: boolean) => void;
  renumberConfirmOpen: boolean;
  setRenumberConfirmOpen: (open: boolean) => void;
  confirmDeleteMateria: () => void;
  confirmRenumberItems: () => void;
  isSaveModelModalOpen: boolean;
  isSavedModelsModalOpen: boolean;
  onCloseSaveModel: () => void;
  onCloseSavedModels: () => void;
  onUseModel: (model: any) => void;
  onModelApplied: () => void;
}

export const NewsScheduleDialogs = ({
  selectedJournal,
  deleteConfirmOpen,
  setDeleteConfirmOpen,
  renumberConfirmOpen,
  setRenumberConfirmOpen,
  confirmDeleteMateria,
  confirmRenumberItems,
  isSaveModelModalOpen,
  isSavedModelsModalOpen,
  onCloseSaveModel,
  onCloseSavedModels,
  onUseModel,
  onModelApplied
}: NewsScheduleDialogsProps) => {
  return (
    <>
      {/* Confirmation Dialogs */}
      <ConfirmationDialogs
        deleteConfirmOpen={deleteConfirmOpen}
        setDeleteConfirmOpen={setDeleteConfirmOpen}
        renumberConfirmOpen={renumberConfirmOpen}
        setRenumberConfirmOpen={setRenumberConfirmOpen}
        confirmDeleteMateria={confirmDeleteMateria}
        confirmRenumberItems={confirmRenumberItems}
      />

      {/* Models Modals */}
      <NewsScheduleModals
        selectedJournal={selectedJournal}
        isSaveModelModalOpen={isSaveModelModalOpen}
        isSavedModelsModalOpen={isSavedModelsModalOpen}
        onCloseSaveModel={onCloseSaveModel}
        onCloseSavedModels={onCloseSavedModels}
        onUseModel={onUseModel}
        onModelApplied={onModelApplied}
      />
    </>
  );
};
