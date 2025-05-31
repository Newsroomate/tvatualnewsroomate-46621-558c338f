
import { Bloco, Materia } from "@/types";

export const findBlocks = (
  blocks: (Bloco & { items: Materia[], totalTime: number })[],
  sourceBlockId: string,
  destBlockId: string
): { sourceBlock: Bloco & { items: Materia[], totalTime: number } | undefined, destBlock: Bloco & { items: Materia[], totalTime: number } | undefined } => {
  const sourceBlock = blocks.find(b => b.id === sourceBlockId);
  const destBlock = blocks.find(b => b.id === destBlockId);
  
  return { sourceBlock, destBlock };
};

export const getMovedItem = (
  sourceBlock: Bloco & { items: Materia[], totalTime: number },
  sourceIndex: number
): Materia => {
  return {...sourceBlock.items[sourceIndex]};
};
