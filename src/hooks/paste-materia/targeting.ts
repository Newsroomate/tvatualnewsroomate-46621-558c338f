
import { Materia } from '@/types';

export interface PasteTarget {
  targetBlockId: string;
  targetBlock: any;
  insertPosition: number;
}

export const determinePasteTarget = (
  selectedMateria: Materia | null,
  blocks: any[]
): PasteTarget | null => {
  let targetBlockId: string;
  let insertPosition: number;
  let targetBlock: any;

  if (selectedMateria) {
    // Se há uma matéria selecionada, colar logo abaixo dela
    targetBlock = blocks.find(block => 
      block.items.some((item: Materia) => item.id === selectedMateria.id)
    );
    
    if (targetBlock) {
      targetBlockId = targetBlock.id;
      const selectedIndex = targetBlock.items.findIndex(
        (item: Materia) => item.id === selectedMateria.id
      );
      insertPosition = selectedIndex + 1;
    } else {
      targetBlockId = blocks[0]?.id;
      targetBlock = blocks[0];
      insertPosition = blocks[0]?.items.length || 0;
    }
  } else {
    // Se não há matéria selecionada, colar no final do primeiro bloco
    targetBlockId = blocks[0]?.id;
    targetBlock = blocks[0];
    insertPosition = blocks[0]?.items.length || 0;
  }

  if (!targetBlockId || !targetBlock) {
    return null;
  }

  return {
    targetBlockId,
    targetBlock,
    insertPosition
  };
};
