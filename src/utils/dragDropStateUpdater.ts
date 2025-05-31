
import { Bloco, Materia } from "@/types";

export const updateUIState = (
  sourceJournal: string,
  destJournal: string,
  updatedSourceBlocks: (Bloco & { items: Materia[], totalTime: number })[],
  updatedDestBlocks: (Bloco & { items: Materia[], totalTime: number })[],
  setPrimaryBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[], totalTime: number })[]>>,
  setSecondaryBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[], totalTime: number })[]>>
): void => {
  console.log('Updating UI state:', { sourceJournal, destJournal });
  
  // Update source journal state
  if (sourceJournal === 'primary') {
    console.log('Updating primary blocks (source):', updatedSourceBlocks.length, 'blocks');
    setPrimaryBlocks(updatedSourceBlocks);
  } else if (sourceJournal === 'secondary') {
    console.log('Updating secondary blocks (source):', updatedSourceBlocks.length, 'blocks');
    setSecondaryBlocks(updatedSourceBlocks);
  }
  
  // Update destination journal state (only if different from source)
  if (sourceJournal !== destJournal) {
    if (destJournal === 'primary') {
      console.log('Updating primary blocks (destination):', updatedDestBlocks.length, 'blocks');
      setPrimaryBlocks(updatedDestBlocks);
    } else if (destJournal === 'secondary') {
      console.log('Updating secondary blocks (destination):', updatedDestBlocks.length, 'blocks');
      setSecondaryBlocks(updatedDestBlocks);
    }
  }
  
  console.log('UI state update completed');
};

export const revertUIState = (
  sourceJournal: string,
  destJournal: string,
  primaryBlocks: (Bloco & { items: Materia[], totalTime: number })[],
  secondaryBlocks: (Bloco & { items: Materia[], totalTime: number })[],
  setPrimaryBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[], totalTime: number })[]>>,
  setSecondaryBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[], totalTime: number })[]>>
): void => {
  console.log('Reverting UI state due to error');
  
  // Revert source journal changes
  if (sourceJournal === 'primary') {
    setPrimaryBlocks(primaryBlocks);
  } else if (sourceJournal === 'secondary') {
    setSecondaryBlocks(secondaryBlocks);
  }
  
  // Revert destination journal changes (only if different from source)
  if (sourceJournal !== destJournal) {
    if (destJournal === 'primary') {
      setPrimaryBlocks(primaryBlocks);
    } else if (destJournal === 'secondary') {
      setSecondaryBlocks(secondaryBlocks);
    }
  }
  
  console.log('UI state reverted');
};
