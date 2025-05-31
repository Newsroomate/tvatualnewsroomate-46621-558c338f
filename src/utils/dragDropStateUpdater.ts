
import { Bloco, Materia } from "@/types";

export const updateUIState = (
  sourceJournal: string,
  destJournal: string,
  updatedSourceBlocks: (Bloco & { items: Materia[], totalTime: number })[],
  updatedDestBlocks: (Bloco & { items: Materia[], totalTime: number })[],
  setPrimaryBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[], totalTime: number })[]>>,
  setSecondaryBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[], totalTime: number })[]>>
): void => {
  // Update UI state immediately for better UX
  if (sourceJournal === 'primary') {
    setPrimaryBlocks(updatedSourceBlocks);
  } else {
    setSecondaryBlocks(updatedSourceBlocks);
  }
  
  if (destJournal === 'primary') {
    setPrimaryBlocks(updatedDestBlocks);
  } else {
    setSecondaryBlocks(updatedDestBlocks);
  }
};

export const revertUIState = (
  sourceJournal: string,
  destJournal: string,
  primaryBlocks: (Bloco & { items: Materia[], totalTime: number })[],
  secondaryBlocks: (Bloco & { items: Materia[], totalTime: number })[],
  setPrimaryBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[], totalTime: number })[]>>,
  setSecondaryBlocks: React.Dispatch<React.SetStateAction<(Bloco & { items: Materia[], totalTime: number })[]>>
): void => {
  // Revert UI changes on error
  if (sourceJournal === 'primary') {
    setPrimaryBlocks(primaryBlocks);
  } else {
    setSecondaryBlocks(secondaryBlocks);
  }
  
  if (destJournal === 'primary') {
    setPrimaryBlocks(primaryBlocks);
  } else {
    setSecondaryBlocks(secondaryBlocks);
  }
};
