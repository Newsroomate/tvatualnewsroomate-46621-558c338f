import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  fetchBlocosByTelejornal, 
  fetchMateriasByBloco, 
} from "@/services/api";
import { Bloco, Materia, Telejornal } from "@/types";
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
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { useBlockManagement } from "@/hooks/useBlockManagement";
import { useItemManagement } from "@/hooks/useItemManagement";
import { generateClipRetrancaPDF } from "@/utils/clip-retranca-pdf-utils";
import { useTeleprompterWindow } from "@/hooks/useTeleprompterWindow";

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
  const [totalJournalTime, setTotalJournalTime] = useState(0);
  const [blockCreationAttempted, setBlockCreationAttempted] = useState(false);
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const { profile } = useAuth();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
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
  
  const { 
    openTeleprompter, 
    updateTeleprompterData, 
    closeTeleprompter 
  } = useTeleprompterWindow();

  // Get all materias from all blocks for teleprompter
  const allMaterias = blocks.flatMap(block => block.items);

  const handleViewTeleprompter = () => {
    console.log("Opening teleprompter with blocks:", blocks);
    openTeleprompter(blocks, currentTelejornal);
  };

  const handleExportClipRetranca = () => {
    if (!currentTelejornal || blocks.length === 0) return;
    
    try {
      generateClipRetrancaPDF(blocks, currentTelejornal);
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
    }
  };

  // Function to scroll to bottom with smooth animation
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Enhanced handleAddBlock with auto-scroll
  const handleAddBlockWithScroll = async () => {
    const previousBlockCount = blocks.length;
    await handleAddBlock();
    
    // Wait a bit for the DOM to update, then scroll
    setTimeout(() => {
      if (blocks.length > previousBlockCount) {
        scrollToBottom();
      }
    }, 100);
  };

  // Enhanced handleAddFirstBlock with auto-scroll
  const handleAddFirstBlockWithScroll = async () => {
    const previousBlockCount = blocks.length;
    await handleAddFirstBlock();
    
    // Wait a bit for the DOM to update, then scroll
    setTimeout(() => {
      if (blocks.length > previousBlockCount) {
        scrollToBottom();
      }
    }, 100);
  };

  // Enhanced handleAddItem with auto-scroll
  const handleAddItemWithScroll = (blockId: string) => {
    const targetBlock = blocks.find(block => block.id === blockId);
    const previousItemCount = targetBlock?.items.length || 0;
    
    handleAddItem(blockId);
    
    // Wait a bit for the DOM to update, then scroll to the block
    setTimeout(() => {
      const updatedBlock = blocks.find(block => block.id === blockId);
      if (updatedBlock && updatedBlock.items.length > previousItemCount) {
        const blockElement = document.querySelector(`[data-block-id="${blockId}"]`);
        if (blockElement && scrollContainerRef.current) {
          blockElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'end',
            inline: 'nearest'
          });
        }
      }
    }, 100);
  };

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
          // Error handling already done in handleAddFirstBlock
        } finally {
          blockCreationInProgress.current = false;
          setIsCreatingFirstBlock(false);
        }
      }
    };
    
    createInitialBlock();
  }, [selectedJournal, currentTelejornal?.espelho_aberto, blocosQuery.data, blockCreationAttempted, isCreatingFirstBlock, handleAddFirstBlock, blockCreationInProgress]);

  // Recalculate total journal time when blocks change
  useEffect(() => {
    const total = blocks.reduce((sum, block) => sum + block.totalTime, 0);
    setTotalJournalTime(total);
  }, [blocks]);

  // Update teleprompter data when blocks change
  useEffect(() => {
    console.log("Blocks changed, updating teleprompter:", blocks);
    updateTeleprompterData(blocks);
  }, [blocks, updateTeleprompterData]);

  const isLoading = telejornaisQuery.isLoading || blocosQuery.isLoading;

  return (
    <div className="flex flex-col h-full">
      {/* Header with journal info and total time */}
      <ScheduleHeader
        currentTelejornal={currentTelejornal}
        totalJournalTime={totalJournalTime}
        onRenumberItems={handleRenumberItems}
        hasBlocks={blocks.length > 0}
        onAddBlock={handleAddBlockWithScroll}
        onViewTeleprompter={handleViewTeleprompter}
        onExportClipRetranca={handleExportClipRetranca}
        blocks={blocks}
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
