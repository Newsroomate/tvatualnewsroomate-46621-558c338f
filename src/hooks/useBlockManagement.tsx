
import { Bloco, Materia, Telejornal } from "@/types";
import { useBlockCreation } from "./block-management/useBlockCreation";
import { useBasicBlockOperations } from "./block-management/useBasicBlockOperations";

interface UseBlockManagementProps {
  blocks: (Bloco & { items: Materia[], totalTime: number })[];
  setBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[], totalTime: number })[]>>;
  selectedJournal: string | null;
  currentTelejornal: Telejornal | null;
  blocosQuery: any;
}

export const useBlockManagement = ({
  blocks,
  setBlocks,
  selectedJournal,
  currentTelejornal,
  blocosQuery
}: UseBlockManagementProps) => {
  const {
    isCreatingFirstBlock,
    setIsCreatingFirstBlock,
    blockCreationInProgress,
    handleAddFirstBlock,
    handleAddBlock
  } = useBlockCreation({
    blocks,
    setBlocks,
    selectedJournal,
    currentTelejornal,
    blocosQuery
  });

  const {
    handleRenameBlock,
    handleDeleteBlock
  } = useBasicBlockOperations({
    selectedJournal,
    currentTelejornal,
    blocks,
    setBlocks,
    blocosQuery
  });

  return {
    isCreatingFirstBlock,
    setIsCreatingFirstBlock,
    blockCreationInProgress,
    handleAddFirstBlock,
    handleAddBlock,
    handleRenameBlock,
    handleDeleteBlock
  };
};
