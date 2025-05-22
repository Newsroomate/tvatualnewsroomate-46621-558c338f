
import { Materia } from "@/types";
import { 
  BlockWithItems, 
  findBlockById, 
  updateBlockItems, 
  updateBlocks, 
  logger,
  findItemById
} from "./utils";
import { processUpdatedMateria, calculateBlockTotalTime } from "@/components/news-schedule/utils";

export const createMateriaOperations = (
  setBlocks: React.Dispatch<React.SetStateAction<BlockWithItems[]>>
) => {
  // Handle materia update (from realtime)
  const handleMateriaUpdate = (updatedMateria: Materia) => {
    logger.info('Processing materia update for UI:', updatedMateria);
    
    // Optimize state updates by using functional updates
    setBlocks(currentBlocks => {
      // Find where this item exists currently
      const { blockId: sourceBlockId } = findItemById(currentBlocks, updatedMateria.id);
      
      // If not found, treat as a new item
      if (!sourceBlockId) {
        return addNewMateriaToBlock(currentBlocks, updatedMateria);
      }
      
      // If the bloco_id changed, this is a move operation between blocks
      if (sourceBlockId !== updatedMateria.bloco_id) {
        return moveMateriaToNewBlock(currentBlocks, updatedMateria, sourceBlockId);
      }
      
      // Simple update of an existing item with priority render
      return updateExistingMateria(currentBlocks, updatedMateria);
    });
  };
  
  // Handle new materia insertion
  const handleMateriaInsert = (newMateria: Materia) => {
    logger.info('Processing materia insert:', newMateria);
    
    setBlocks(currentBlocks => {
      return addNewMateriaToBlock(currentBlocks, newMateria);
    });
  };
  
  // Handle materia deletion
  const handleMateriaDelete = (deletedMateria: Materia) => {
    logger.info('Processing materia deletion:', deletedMateria);
    
    setBlocks(currentBlocks => {
      return currentBlocks.map(block => {
        if (block.id === deletedMateria.bloco_id) {
          const updatedItems = block.items.filter(item => item.id !== deletedMateria.id);
          return {
            ...block,
            items: updatedItems,
            totalTime: calculateBlockTotalTime(updatedItems)
          };
        }
        return block;
      });
    });
  };
  
  // Helper functions for various materia operations
  
  // Add a new materia to its block
  const addNewMateriaToBlock = (blocks: BlockWithItems[], materia: Materia): BlockWithItems[] => {
    return blocks.map(block => {
      if (block.id === materia.bloco_id) {
        // Process to ensure consistent format
        const processedMateria = processUpdatedMateria(materia);
        
        // Insert the item at the correct position based on ordem
        const updatedItems = [...block.items];
        const insertIndex = updatedItems.findIndex(item => 
          (item.ordem || 0) > (materia.ordem || 0)
        );
        
        if (insertIndex === -1) {
          updatedItems.push(processedMateria);
        } else {
          updatedItems.splice(insertIndex, 0, processedMateria);
        }
        
        return updateBlockItems(block, updatedItems);
      }
      return block;
    });
  };
  
  // Move a materia from one block to another
  const moveMateriaToNewBlock = (
    blocks: BlockWithItems[], 
    updatedMateria: Materia, 
    sourceBlockId: string
  ): BlockWithItems[] => {
    logger.info(`Item ${updatedMateria.id} moved from block ${sourceBlockId} to ${updatedMateria.bloco_id}`);
    
    // Process blocks in immutable way
    return blocks.map(block => {
      // Remove from source block
      if (block.id === sourceBlockId) {
        const updatedItems = block.items.filter(item => item.id !== updatedMateria.id);
        return updateBlockItems(block, updatedItems);
      }
      
      // Add to destination block
      if (block.id === updatedMateria.bloco_id) {
        const processedMateria = processUpdatedMateria(updatedMateria);
        
        // Find the correct position based on ordem
        const updatedItems = [...block.items];
        const insertIndex = updatedItems.findIndex(item => 
          (item.ordem || 0) > (updatedMateria.ordem || 0)
        );
        
        if (insertIndex === -1) {
          updatedItems.push(processedMateria);
        } else {
          updatedItems.splice(insertIndex, 0, processedMateria);
        }
        
        return updateBlockItems(block, updatedItems);
      }
      
      return block;
    });
  };
  
  // Update an existing materia in its current block with improved efficiency
  const updateExistingMateria = (
    blocks: BlockWithItems[], 
    updatedMateria: Materia
  ): BlockWithItems[] => {
    // Immediately process the materia to ensure format consistency
    const processedMateria = processUpdatedMateria(updatedMateria);
    
    return blocks.map(block => {
      if (block.id === updatedMateria.bloco_id) {
        // Shallow copy the items array for comparison
        const updatedItems = block.items.map(item => 
          item.id === updatedMateria.id ? processedMateria : item
        );
        
        // Only create a new block if there were actual changes
        return updateBlockItems(block, updatedItems);
      }
      return block;
    });
  };
  
  return {
    handleMateriaUpdate,
    handleMateriaInsert,
    handleMateriaDelete
  };
};
