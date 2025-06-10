import { useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { Bloco, Materia, Telejornal } from "@/types";
import { ScheduleHeader } from "./ScheduleHeader";
import { ScheduleContent } from "./ScheduleContent";
import { ConfirmationDialogs } from "./ConfirmationDialogs";
import { useNewsSchedule } from "@/hooks/useNewsSchedule";
import { useScrollUtils } from "@/hooks/useScrollUtils";
import { useEnhancedHandlers } from "@/hooks/useEnhancedHandlers";
import { SaveModelModal } from "@/components/models/SaveModelModal";
import { SavedModelsModal } from "@/components/models/SavedModelsModal";
import { SavedModel } from "@/services/models-api";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

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
  const isDualViewMode = !!externalBlocks && !!onBlocksChange;
  const [isSaveModelModalOpen, setIsSaveModelModalOpen] = useState(false);
  const [isSavedModelsModalOpen, setIsSavedModelsModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const {
    blocks: internalBlocks,
    totalJournalTime,
    isLoading,
    isCreatingFirstBlock,
    newItemBlock,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    renumberConfirmOpen,
    setRenumberConfirmOpen,
    isDeleting,
    handleAddItem,
    handleDuplicateItem,
    handleDeleteMateria,
    confirmDeleteMateria,
    handleBatchDeleteMaterias,
    handleRenumberItems,
    confirmRenumberItems,
    handleAddFirstBlock,
    handleAddBlock,
    handleRenameBlock,
    handleDeleteBlock,
    handleDragEnd,
    openTeleprompter
  } = useNewsSchedule({ 
    selectedJournal, 
    currentTelejornal, 
    onEditItem,
    externalBlocks: isDualViewMode ? externalBlocks : undefined,
    onBlocksChange: isDualViewMode ? onBlocksChange : undefined
  });

  // Use external blocks in dual view mode, otherwise use internal blocks
  const blocks = isDualViewMode ? externalBlocks : internalBlocks;
  
  const { scrollContainerRef, scrollToBottom, scrollToBlock } = useScrollUtils();

  const {
    handleAddBlockWithScroll,
    handleAddFirstBlockWithScroll,
    handleAddItemWithScroll
  } = useEnhancedHandlers({
    blocks,
    handleAddBlock,
    handleAddFirstBlock,
    handleAddItem,
    scrollToBottom,
    scrollToBlock
  });

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

    setIsSaveModelModalOpen(true);
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

  const scheduleContent = (
    <>
      {/* Header with journal info and total time */}
      <ScheduleHeader
        currentTelejornal={currentTelejornal}
        totalJournalTime={totalJournalTime}
        onRenumberItems={handleRenumberItems}
        hasBlocks={blocks.length > 0}
        onAddBlock={handleAddBlockWithScroll}
        onViewTeleprompter={handleViewTeleprompter}
        onSaveModel={handleSaveModel}
        onViewSavedModels={() => setIsSavedModelsModalOpen(true)}
        blocks={blocks}
      />

      {/* Main area with blocks - improved scrolling and padding */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 pb-32 space-y-6"
        style={{ 
          scrollBehavior: 'smooth',
          paddingBottom: 'max(8rem, 20vh)' // Responsive bottom padding
        }}
      >
        <ScheduleContent
          selectedJournal={selectedJournal}
          currentTelejornal={currentTelejornal}
          blocks={blocks}
          isLoading={isLoading}
          isCreatingFirstBlock={isCreatingFirstBlock}
          newItemBlock={newItemBlock}
          onOpenRundown={onOpenRundown}
          onAddFirstBlock={handleAddFirstBlockWithScroll}
          onAddBlock={handleAddBlockWithScroll}
          onAddItem={handleAddItemWithScroll}
          onEditItem={onEditItem}
          onDeleteItem={handleDeleteMateria}
          onDuplicateItem={handleDuplicateItem}
          onRenameBlock={handleRenameBlock}
          onDeleteBlock={handleDeleteBlock}
          journalPrefix={journalPrefix}
          onBatchDeleteItems={handleBatchDeleteMaterias}
          isDeleting={isDeleting}
        />
      </div>

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

  return (
    <div className="flex flex-col h-full">
      {isDualView ? (
        // In dual view, don't wrap with DragDropContext as it's handled by DualViewLayout
        scheduleContent
      ) : (
        // In single view, wrap with DragDropContext for internal drag and drop
        <DragDropContext onDragEnd={handleDragEndWithLogging}>
          {scheduleContent}
        </DragDropContext>
      )}
    </div>
  );
};
