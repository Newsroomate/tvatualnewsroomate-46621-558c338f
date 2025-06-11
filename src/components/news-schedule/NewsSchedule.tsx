
import { Bloco, Materia, Telejornal } from "@/types";
import { NewsScheduleHooks } from "./NewsScheduleHooks";
import { NewsScheduleCore } from "./NewsScheduleCore";
import { NewsScheduleDialogs } from "./NewsScheduleDialogs";

type BlockWithItems = Bloco & { 
  items: Materia[];
  totalTime: number;
};

interface NewsScheduleProps {
  selectedJournal: string | null;
  onEditItem: (Materia) => void;
  currentTelejornal: Telejornal | null;
  onOpenRundown: () => void;
  journalPrefix?: string;
  externalBlocks?: BlockWithItems[];
  onBlocksChange?: (blocks: BlockWithItems[]) => void;
  isDualView?: boolean;
}

export const NewsSchedule = ({ 
  selectedJournal, 
  onEditItem, 
  currentTelejornal, 
  onOpenRundown,
  journalPrefix = "default",
  externalBlocks,
  onBlocksChange,
  isDualView = false
}: NewsScheduleProps) => {
  return (
    <NewsScheduleHooks
      selectedJournal={selectedJournal}
      currentTelejornal={currentTelejornal}
      onEditItem={onEditItem}
      journalPrefix={journalPrefix}
      externalBlocks={externalBlocks}
      onBlocksChange={onBlocksChange}
    >
      {(hookProps) => (
        <>
          <NewsScheduleCore
            selectedJournal={selectedJournal}
            onEditItem={onEditItem}
            currentTelejornal={currentTelejornal}
            onOpenRundown={onOpenRundown}
            journalPrefix={journalPrefix}
            blocks={hookProps.blocks}
            totalJournalTime={hookProps.totalJournalTime}
            isLoading={hookProps.isLoading}
            isCreatingFirstBlock={hookProps.isCreatingFirstBlock}
            newItemBlock={hookProps.newItemBlock}
            isDeleting={hookProps.isDeleting}
            selectedMateria={hookProps.selectedMateria}
            onMateriaSelect={hookProps.handleMateriaSelect}
            handleAddItem={hookProps.handleAddItem}
            handleDuplicateItem={hookProps.handleDuplicateItem}
            handleDeleteMateria={hookProps.handleDeleteMateria}
            handleBatchDeleteMaterias={hookProps.handleBatchDeleteMaterias}
            handleRenumberItems={hookProps.handleRenumberItems}
            handleAddFirstBlock={hookProps.handleAddFirstBlock}
            handleAddBlock={hookProps.handleAddBlock}
            handleRenameBlock={hookProps.handleRenameBlock}
            handleDeleteBlock={hookProps.handleDeleteBlock}
            handleDragEnd={hookProps.handleDragEndWithLogging}
            handleViewTeleprompter={hookProps.handleViewTeleprompter}
            handleSaveModel={hookProps.handleSaveModel}
            handleViewSavedModels={hookProps.handleViewSavedModels}
            isDualView={isDualView}
            // Adicionando props explícitas para clipboard
            copyMateria={hookProps.copyMateria}
            pasteMateria={hookProps.pasteMateria}
            hasCopiedMateria={hookProps.hasCopiedMateria}
          />

          <NewsScheduleDialogs
            selectedJournal={selectedJournal}
            deleteConfirmOpen={hookProps.deleteConfirmOpen}
            setDeleteConfirmOpen={hookProps.setDeleteConfirmOpen}
            renumberConfirmOpen={hookProps.renumberConfirmOpen}
            setRenumberConfirmOpen={hookProps.setRenumberConfirmOpen}
            confirmDeleteMateria={hookProps.confirmDeleteMateria}
            confirmRenumberItems={hookProps.confirmRenumberItems}
            isSaveModelModalOpen={hookProps.isSaveModelModalOpen}
            isSavedModelsModalOpen={hookProps.isSavedModelsModalOpen}
            onCloseSaveModel={() => hookProps.setIsSaveModelModalOpen(false)}
            onCloseSavedModels={() => hookProps.setIsSavedModelsModalOpen(false)}
            onUseModel={hookProps.handleUseModel}
            onModelApplied={hookProps.handleModelApplied}
          />
        </>
      )}
    </NewsScheduleHooks>
  );
};
