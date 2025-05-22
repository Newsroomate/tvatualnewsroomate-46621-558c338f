
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMateriasByBloco, fetchTelejornais } from "@/services/api";
import { Telejornal } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { ScheduleHeader } from "./ScheduleHeader";
import { ScheduleContent } from "./ScheduleContent";
import { Teleprompter } from "../teleprompter/Teleprompter";
import { useAuth } from "@/context/AuthContext";
import { useRealtimeMaterias } from "@/hooks/useRealtimeMaterias";
import { useBlockOperations } from "@/hooks/useBlockOperations";
import { useMateriaOperations } from "@/hooks/useMateriaOperations";
import { ConfirmationDialog } from "./ConfirmationDialog";

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
  const [renumberConfirmOpen, setRenumberConfirmOpen] = useState(false);
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();
  
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
    trackDragOperation 
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

  // Process blocks data when it changes
  useEffect(() => {
    if (!blocosQuery.data || !selectedJournal) return;
    
    const loadBlocos = async () => {
      try {
        const blocosComItems = await Promise.all(
          blocosQuery.data.map(async (bloco) => {
            const materias = await fetchMateriasByBloco(bloco.id);
            const totalTime = materias.reduce((sum, item) => sum + item.duracao, 0);
            return {
              ...bloco,
              items: materias,
              totalTime
            };
          })
        );
        
        setBlocks(blocosComItems);
        
        // Reset the flag since we've processed the data
        setBlockCreationAttempted(true);
      } catch (error) {
        console.error("Erro ao carregar blocos e matérias:", error);
      }
    };
    
    loadBlocos();
  }, [blocosQuery.data, selectedJournal, setBlocks]);

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

  // Recalculate total journal time when blocks change
  useEffect(() => {
    const total = blocks.reduce((sum, block) => sum + block.totalTime, 0);
    setTotalJournalTime(total);
  }, [blocks]);

  const handleOpenTeleprompter = (shouldOpen: boolean) => {
    if (shouldOpen && blocks.length === 0) {
      toast({
        title: "Sem blocos",
        description: "Não há blocos para exibir no teleprompter.",
        variant: "destructive"
      });
      return;
    }
    
    setShowTeleprompter(shouldOpen);
    
    if (shouldOpen) {
      toast({
        title: "✅ Espelho carregado",
        description: "Espelho carregado no modo Teleprompter com sucesso.",
        variant: "default"
      });
    }
  };

  const handleItemClick = (item: any) => {
    onEditItem(item);
  };

  const triggerRenumberItems = async () => {
    const canProceed = await handleRenumberItems(blocks);
    if (canProceed) {
      setRenumberConfirmOpen(true);
    }
  };

  const isLoading = telejornaisQuery.isLoading || blocosQuery.isLoading;

  return (
    <div className="flex flex-col h-full">
      {/* Header with journal info and total time */}
      <ScheduleHeader
        currentTelejornal={currentTelejornal}
        totalJournalTime={totalJournalTime}
        onRenumberItems={triggerRenumberItems}
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
