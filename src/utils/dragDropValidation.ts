
export const validateDragOperation = (
  result: any,
  isEspelhoAberto: boolean
): { isValid: boolean; reason?: string } => {
  const { source, destination } = result;
  
  if (!isEspelhoAberto) {
    return { isValid: false, reason: "Espelho fechado" };
  }
  
  // Dropped outside the list or no movement
  if (!destination || 
      (source.droppableId === destination.droppableId && 
       source.index === destination.index)) {
    return { isValid: false, reason: "No movement" };
  }
  
  return { isValid: true };
};

export const isCrossPanelDrag = (source: any, destination: any): boolean => {
  const sourceJournal = source.droppableId.includes('primary-') ? 'primary' : 
                       source.droppableId.includes('secondary-') ? 'secondary' : 'single';
  const destJournal = destination.droppableId.includes('primary-') ? 'primary' : 
                     destination.droppableId.includes('secondary-') ? 'secondary' : 'single';
  
  return sourceJournal !== destJournal && (sourceJournal !== 'single' || destJournal !== 'single');
};

export const extractBlockIds = (
  source: any, 
  destination: any, 
  journalPrefix: string
): { sourceBlockId: string; destBlockId: string } => {
  let sourceBlockId = source.droppableId;
  let destBlockId = destination.droppableId;
  
  if (journalPrefix && journalPrefix !== "default") {
    sourceBlockId = sourceBlockId.replace(`${journalPrefix}-`, '');
    destBlockId = destBlockId.replace(`${journalPrefix}-`, '');
  }
  
  return { sourceBlockId, destBlockId };
};
