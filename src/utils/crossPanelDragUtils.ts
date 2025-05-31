
import { Bloco, Materia } from "@/types";

export const determineJournalFromDroppableId = (droppableId: string): 'primary' | 'secondary' | null => {
  if (droppableId.includes('primary-')) return 'primary';
  if (droppableId.includes('secondary-')) return 'secondary';
  return null;
};

export const extractBlockId = (droppableId: string): string => {
  return droppableId.replace(/^(primary|secondary)-/, '');
};

export const getBlocksForJournal = (
  journal: 'primary' | 'secondary',
  primaryBlocks: (Bloco & { items: Materia[], totalTime: number })[],
  secondaryBlocks: (Bloco & { items: Materia[], totalTime: number })[]
) => {
  return journal === 'primary' ? primaryBlocks : secondaryBlocks;
};

export const findBlock = (
  blocks: (Bloco & { items: Materia[], totalTime: number })[],
  blockId: string
) => {
  return blocks.find(b => b.id === blockId);
};

export const isCrossJournalTransfer = (sourceJournal: string, destJournal: string): boolean => {
  return sourceJournal !== destJournal;
};
