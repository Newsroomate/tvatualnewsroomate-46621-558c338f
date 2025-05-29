
import { Bloco, Materia, Telejornal } from "@/types";
import { useFirstBlockCreation } from "./useFirstBlockCreation";
import { useBlockOperations } from "./useBlockOperations";

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
    handleAddFirstBlock
  } = useFirstBlockCreation({
    blocks,
    setBlocks,
    selectedJournal,
    currentTelejornal,
    blocosQuery
  });

  const {
    handleAddBlock,
    handleRenameBlock,
    handleDeleteBlock
  } = useBlockOperations({
    blocks,
    setBlocks,
    selectedJournal,
    currentTelejornal,
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
