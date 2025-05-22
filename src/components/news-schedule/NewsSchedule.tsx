
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTelejornais } from "@/services/api";
import { Telejornal } from "@/types";
import { ScheduleHeader } from "./ScheduleHeader";
import { ScheduleContent } from "./ScheduleContent";
import { Teleprompter } from "../teleprompter/Teleprompter";
import { useAuth } from "@/context/AuthContext";
import { useRealtimeMaterias } from "@/hooks/useRealtimeMaterias";
import { useBlockOperations } from "@/hooks/useBlockOperations";
import { useMateriaOperations } from "@/hooks/useMateriaOperations";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { useTeleprompter } from "@/hooks/useTeleprompter";
import { useConfirmation } from "@/hooks/useConfirmation";
import { useItemOperations } from "@/hooks/useItemOperations";

export interface NewsScheduleProps {
  selectedJournal: string | null;
  onEditItem: (item: any) => void;
  currentTelejornal: Telejornal | null;
  onOpenRundown: () => void;
}

export const NewsSchedule = ({ 
  selectedJournal, 
  onEditItem, 
  currentTelejornal, 
  onOpenRundown 
}: NewsScheduleProps) => {
  const [totalJournalTime, setTotalJournalTime] = useState(0);
  const [telejornais, setTelejornais] = useState<Telejornal[]>([]);
  
  // Use materia operations hook first to access the state we need for useRealtimeMaterias
  const {
    newItemBlock,
    setNewItemBlock,
    materiaToDelete,
    setMateriaToDelete,
    deleteConfirmOpen,
    setDeleteConfirmOpen
  } = useMateriaOperations();
  
  // Now use our enhanced custom hook for realtime updates with all required props
  const { 
    blocks, 
    setBlocks, 
    startDragging, 
    endDragging, 
    trackDragOperation,
    handleMateriaEdit
  } = useRealtimeMaterias({
    selectedJournal,
    newItemBlock,
    materiaToDelete
  });

  // Use block operations hook
  const {
    isCreatingFirstBlock,
    setIsCreatingFirstBlock,
    blockCreationAttempted,
    setBlockCreationAttempted,
    blockCreationInProgress,
    blocosQuery,
    handleAddFirstBlock,
    handleAddBlock,
    handleRenameBlock,
    handleDeleteBlock
  } = useBlockOperations(selectedJournal, currentTelejornal, setBlocks);

  // Reinitialize materia operations with the blocks state and current telejornal
  const {
    handleAddItem,
    handleDeleteMateria,
    confirmDeleteMateria,
    handleDragEnd,
    handleRenumberItems,
    confirmRenumberItems
  } = useMateriaOperations(setBlocks, currentTelejornal, setMateriaToDelete, setDeleteConfirmOpen, setNewItemBlock);

  // Use teleprompter hook
  const { 
    showTeleprompter, 
    setShowTeleprompter, 
    handleOpenTeleprompter 
  } = useTeleprompter(blocks);

  // Use confirmation hook
  const {
    renumberConfirmOpen,
    setRenumberConfirmOpen,
    triggerRenumberItems
  } = useConfirmation();

  // Use item operations hook
  const { handleItemClick } = useItemOperations(onEditItem, handleMateriaEdit);

  // Fetch telejornais
  const telejornaisQuery = useQuery({
    queryKey: ['telejornais'],
    queryFn: fetchTelejornais,
  });

  // Update state when telejornais data is fetched
  useEffect(() => {
    if (telejornaisQuery.data) {
      setTelejornais(telejornaisQuery.data);
    }
  }, [telejornaisQuery.data]);

  // Recalculate total journal time when blocks change
  useEffect(() => {
    const total = blocks.reduce((sum, block) => sum + block.totalTime, 0);
    setTotalJournalTime(total);
  }, [blocks]);

  const isLoading = telejornaisQuery.isLoading || blocosQuery.isLoading;

  return (
    <div className="flex flex-col h-full">
      {/* Header with journal info and total time */}
      <ScheduleHeader
        currentTelejornal={currentTelejornal}
        totalJournalTime={totalJournalTime}
        onRenumberItems={() => triggerRenumberItems(blocks, currentTelejornal, handleRenumberItems)}
        hasBlocks={blocks.length > 0}
        blocksWithItems={blocks}
        onOpenTeleprompter={handleOpenTeleprompter}
      />

      {/* Main area with blocks */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <ScheduleContent
          selectedJournal={selectedJournal}
          currentTelejornal={currentTelejornal}
          blocks={blocks}
          isLoading={isLoading}
          isCreatingFirstBlock={isCreatingFirstBlock}
          newItemBlock={newItemBlock}
          onOpenRundown={onOpenRundown}
          onAddFirstBlock={handleAddFirstBlock}
          onAddBlock={() => handleAddBlock(blocks)}
          onAddItem={blocoId => handleAddItem(blocoId, blocks)}
          onEditItem={handleItemClick}
          onDeleteItem={handleDeleteMateria}
          onRenameBlock={(blockId, newName) => handleRenameBlock(blockId, newName, blocks)}
          onDeleteBlock={blockId => handleDeleteBlock(blockId, blocks)}
          onDragEnd={result => handleDragEnd(result, blocks)}
          startDragging={startDragging}
          endDragging={endDragging}
          trackDragOperation={trackDragOperation}
          handleMateriaEdit={handleMateriaEdit}
        />
      </div>

      {/* Teleprompter view (conditionally rendered) */}
      {showTeleprompter && (
        <Teleprompter 
          blocks={blocks}
          onClose={() => setShowTeleprompter(false)}
        />
      )}

      {/* Delete confirmation dialog */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Confirmar Exclusão"
        description="Tem certeza que deseja excluir esta matéria? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        confirmVariant="destructive"
        onConfirm={() => confirmDeleteMateria(blocks)}
      />

      {/* Renumber confirmation dialog */}
      <ConfirmationDialog
        open={renumberConfirmOpen}
        onOpenChange={setRenumberConfirmOpen}
        title="Reorganizar Numeração"
        description="Esta ação irá renumerar todas as matérias sequencialmente com base na ordem atual. Deseja continuar?"
        confirmText="Reorganizar"
        onConfirm={() => confirmRenumberItems(blocks, setRenumberConfirmOpen)}
      />
    </div>
  );
};
