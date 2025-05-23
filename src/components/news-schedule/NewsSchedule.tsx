
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
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  
  // Use o hook de operações de matéria primeiro para acessar o estado de que precisamos para useRealtimeMaterias
  const {
    newItemBlock,
    setNewItemBlock,
    materiaToDelete,
    setMateriaToDelete,
    deleteConfirmOpen,
    setDeleteConfirmOpen
  } = useMateriaOperations();

  // Use o hook de operações de bloco
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
  } = useBlockOperations(selectedJournal, currentTelejornal);
  
  // Agora use nosso hook personalizado aprimorado para atualizações em tempo real com todos os props necessários
  const { 
    blocks, 
    setBlocks, 
    startDragging, 
    endDragging, 
    trackDragOperation,
    handleMateriaEdit,
    handleMateriaSave,
    initialDataLoaded
  } = useRealtimeMaterias({
    selectedJournal,
    newItemBlock,
    materiaToDelete,
    blocosData: blocosQuery.data,
    isLoading: blocosQuery.isLoading
  });

  // Reinicializa as operações de matéria com o estado de blocos e telejornal atual
  const {
    handleAddItem,
    handleDeleteMateria,
    confirmDeleteMateria,
    handleDragEnd,
    handleRenumberItems,
    confirmRenumberItems
  } = useMateriaOperations(setBlocks, currentTelejornal, setMateriaToDelete, setDeleteConfirmOpen, setNewItemBlock);

  // Use o hook do teleprompter
  const { 
    showTeleprompter, 
    setShowTeleprompter, 
    handleOpenTeleprompter 
  } = useTeleprompter(blocks);

  // Use o hook de confirmação
  const {
    renumberConfirmOpen,
    setRenumberConfirmOpen,
    triggerRenumberItems
  } = useConfirmation();

  // Use o hook de operações de item com o callback de salvamento
  const { handleItemClick } = useItemOperations(onEditItem, handleMateriaEdit, handleMateriaSave);

  // Fetch telejornais
  const telejornaisQuery = useQuery({
    queryKey: ['telejornais'],
    queryFn: fetchTelejornais,
  });

  // Atualiza o estado quando os dados de telejornais são buscados
  useEffect(() => {
    if (telejornaisQuery.data) {
      setTelejornais(telejornaisQuery.data);
    }
  }, [telejornaisQuery.data]);

  // Handle auto-creation of first block, separated from the blocks data processing effect
  useEffect(() => {
    // Skip if no telejornal selected, espelho is not open, or we're already creating a block
    if (!selectedJournal || !currentTelejornal?.espelho_aberto || blockCreationInProgress.current || isCreatingFirstBlock) {
      return;
    }
    
    // Skip if we don't have the blocks data yet or if we've already checked
    if (!blocosQuery.data || !blockCreationAttempted) {
      return;
    }

    const createInitialBlock = async () => {
      // Only create a block if there are no blocks and we haven't already tried
      if (blocosQuery.data.length === 0 && !blockCreationInProgress.current) {
        setIsCreatingFirstBlock(true);
        blockCreationInProgress.current = true;
        
        console.log("Attempting to create initial block for telejornal:", selectedJournal);
        
        try {
          await handleAddFirstBlock();
        } catch (error) {
          console.error("Erro ao criar o bloco inicial:", error);
          // If the error is about a duplicate, we can ignore it - the block exists
          if (error instanceof Error && error.message.includes("duplicate key value")) {
            console.log("Block already exists, refreshing data...");
            // Force a refresh of blocks query
            blocosQuery.refetch();
          } else {
            toast({
              title: "Erro ao criar bloco inicial",
              description: "Ocorreu um erro ao criar o primeiro bloco. Por favor, tente novamente.",
              variant: "destructive"
            });
          }
        } finally {
          blockCreationInProgress.current = false;
          setIsCreatingFirstBlock(false);
        }
      }
    };
    
    createInitialBlock();
  }, [selectedJournal, currentTelejornal?.espelho_aberto, blocosQuery.data, blockCreationAttempted]);

  // Recalcula o tempo total do jornal quando os blocos mudam
  useEffect(() => {
    const total = blocks.reduce((sum, block) => sum + block.totalTime, 0);
    setTotalJournalTime(total);
  }, [blocks]);

  // Add debug logs for data flow
  useEffect(() => {
    if (selectedJournal) {
      console.log("Selected journal changed:", selectedJournal);
      console.log("Current blocks state:", blocks);
      console.log("Blocos query data:", blocosQuery.data);
      console.log("Initial data loaded:", initialDataLoaded);
    }
  }, [selectedJournal, blocks, blocosQuery.data, initialDataLoaded]);

  const isLoading = telejornaisQuery.isLoading || 
                    blocosQuery.isLoading || 
                    (selectedJournal && !initialDataLoaded && blocosQuery.data && blocosQuery.data.length > 0);

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
