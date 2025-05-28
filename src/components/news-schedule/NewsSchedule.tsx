
import { useQuery } from "@tanstack/react-query";
import { 
  fetchBlocosByTelejornal, 
} from "@/services/api";
import { Materia, Telejornal } from "@/types";
import { fetchTelejornais } from "@/services/api";
import { DragDropContext } from "@hello-pangea/dnd";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/AuthContext";
import { useRealtimeMaterias } from "@/hooks/useRealtimeMaterias";
import { ScheduleHeader } from "./ScheduleHeader";
import { ScheduleContent } from "./ScheduleContent";
import { Teleprompter } from "./Teleprompter";
import { NewsScheduleEffects } from "./NewsScheduleEffects";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { useBlockManagement } from "@/hooks/useBlockManagement";
import { useItemManagement } from "@/hooks/useItemManagement";
import { useNewsScheduleState } from "@/hooks/useNewsScheduleState";
import { useScrollToBottom } from "@/hooks/useScrollToBottom";
import { useNewsScheduleActions } from "@/hooks/useNewsScheduleActions";
import { useEnhancedBlockActions } from "@/hooks/useEnhancedBlockActions";

interface NewsScheduleProps {
  selectedJournal: string | null;
  onEditItem: (Materia) => void;
  currentTelejornal: Telejornal | null;
  onOpenRundown: () => void;
}

export const NewsSchedule = ({ 
  selectedJournal, 
  onEditItem, 
  currentTelejornal, 
  onOpenRundown 
}: NewsScheduleProps) => {
  const { profile } = useAuth();
  
  // Custom hooks for state management
  const {
    totalJournalTime,
    setTotalJournalTime,
    blockCreationAttempted,
    setBlockCreationAttempted,
    showTeleprompter,
    setShowTeleprompter
  } = useNewsScheduleState();

  const { scrollContainerRef, scrollToBottom, scrollToBlock } = useScrollToBottom();
  
  // Fetch telejornais
  const telejornaisQuery = useQuery({
    queryKey: ['telejornais'],
    queryFn: fetchTelejornais,
  });

  // Fetch blocks for the selected journal
  const blocosQuery = useQuery({
    queryKey: ['blocos', selectedJournal],
    queryFn: () => selectedJournal ? fetchBlocosByTelejornal(selectedJournal) : Promise.resolve([]),
    enabled: !!selectedJournal,
  });

  // Use our custom hooks for realtime updates and state management
  const { blocks, setBlocks } = useRealtimeMaterias({
    selectedJournal,
    newItemBlock: null,
    materiaToDelete: null
  });

  // Use the custom hooks for item, block, and drag-drop management
  const { 
    newItemBlock, 
    setNewItemBlock,
    deleteConfirmOpen, 
    setDeleteConfirmOpen,
    materiaToDelete, 
    setMateriaToDelete,
    renumberConfirmOpen, 
    setRenumberConfirmOpen,
    handleAddItem,
    handleDuplicateItem,
    handleDeleteMateria, 
    confirmDeleteMateria,
    handleRenumberItems, 
    confirmRenumberItems 
  } = useItemManagement({ 
    blocks, 
    setBlocks, 
    currentTelejornal 
  });

  const { 
    isCreatingFirstBlock, 
    setIsCreatingFirstBlock,
    blockCreationInProgress,
    handleAddFirstBlock, 
    handleAddBlock,
    handleRenameBlock,
    handleDeleteBlock
  } = useBlockManagement({ 
    blocks, 
    setBlocks, 
    selectedJournal, 
    currentTelejornal, 
    blocosQuery 
  });

  const { handleDragEnd } = useDragAndDrop({ 
    blocks, 
    setBlocks, 
    isEspelhoAberto: !!currentTelejornal?.espelho_aberto 
  });

  // Export and action handlers
  const { handleViewTeleprompter, handleExportClipRetranca, handleExportGC } = useNewsScheduleActions({
    currentTelejornal,
    blocks,
    setShowTeleprompter
  });

  // Enhanced block actions with scroll
  const {
    handleAddBlockWithScroll,
    handleAddFirstBlockWithScroll,
    handleAddItemWithScroll
  } = useEnhancedBlockActions({
    blocks,
    handleAddBlock,
    handleAddFirstBlock,
    handleAddItem,
    scrollToBottom,
    scrollToBlock
  });

  // Get all materias from all blocks for teleprompter
  const allMaterias = blocks.flatMap(block => block.items);

  const isLoading = telejornaisQuery.isLoading || blocosQuery.isLoading;

  return (
    <div className="flex flex-col h-full">
      {/* Effects component for side effects */}
      <NewsScheduleEffects
        selectedJournal={selectedJournal}
        currentTelejornal={currentTelejornal}
        blocosQuery={blocosQuery}
        blocks={blocks}
        setBlocks={setBlocks}
        setTotalJournalTime={setTotalJournalTime}
        setBlockCreationAttempted={setBlockCreationAttempted}
        blockCreationAttempted={blockCreationAttempted}
        isCreatingFirstBlock={isCreatingFirstBlock}
        handleAddFirstBlock={handleAddFirstBlock}
        blockCreationInProgress={blockCreationInProgress}
        setIsCreatingFirstBlock={setIsCreatingFirstBlock}
      />

      {/* Header with journal info and total time */}
      <ScheduleHeader
        currentTelejornal={currentTelejornal}
        totalJournalTime={totalJournalTime}
        onRenumberItems={handleRenumberItems}
        hasBlocks={blocks.length > 0}
        onAddBlock={handleAddBlockWithScroll}
        onViewTeleprompter={handleViewTeleprompter}
        onExportClipRetranca={handleExportClipRetranca}
        onExportGC={handleExportGC}
      />

      {/* Main area with blocks */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-6"
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
          />
        </div>
      </DragDropContext>

      {/* Teleprompter Modal */}
      <Teleprompter
        isOpen={showTeleprompter}
        onClose={() => setShowTeleprompter(false)}
        materias={allMaterias}
        telejornal={currentTelejornal}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta matéria? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDeleteMateria}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Renumber confirmation dialog */}
      <AlertDialog open={renumberConfirmOpen} onOpenChange={setRenumberConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reorganizar Numeração</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá renumerar todas as matérias sequencialmente com base na ordem atual. 
              Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRenumberItems}>
              Reorganizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
