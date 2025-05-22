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
    
    // Optimize state updates by using functional updates with priority rendering
    setBlocks(currentBlocks => {
      try {
        // Process materia immediately to ensure consistent format
        const processedMateria = processUpdatedMateria(updatedMateria);
        
        // Find where this item exists currently
        const { blockId: sourceBlockId } = findItemById(currentBlocks, updatedMateria.id);
        
        // If not found, treat as a new item
        if (!sourceBlockId) {
          logger.debug(`Item ${updatedMateria.id} not found in current blocks, adding as new`);
          return addNewMateriaToBlock(currentBlocks, processedMateria);
        }
        
        // If the bloco_id changed, this is a move operation between blocks
        if (sourceBlockId !== updatedMateria.bloco_id) {
          logger.debug(`Item ${updatedMateria.id} moved blocks from ${sourceBlockId} to ${updatedMateria.bloco_id}`);
          return moveMateriaToNewBlock(currentBlocks, processedMateria, sourceBlockId);
        }
        
        // Fast path for simple updates to improve UI responsiveness
        logger.debug(`Updating item ${updatedMateria.id} in block ${sourceBlockId}`);
        return updateExistingMateria(currentBlocks, processedMateria);
      } catch (error) {
        logger.error('Error processing materia update:', error);
        // Return unchanged blocks on error to prevent UI breakage
        return currentBlocks;
      }
    });
  };
  
  // Handle new materia insertion
  const handleMateriaInsert = (newMateria: Materia) => {
    logger.info('Processing materia insert:', newMateria);
    
    setBlocks(currentBlocks => {
      try {
        const processedMateria = processUpdatedMateria(newMateria);
        return addNewMateriaToBlock(currentBlocks, processedMateria);
      } catch (error) {
        logger.error('Error processing materia insert:', error);
        return currentBlocks;
      }
    });
  };
  
  // Handle materia deletion
  const handleMateriaDelete = (deletedMateria: Materia) => {
    logger.info('Processing materia deletion:', deletedMateria);
    
    setBlocks(currentBlocks => {
      try {
        // Check if the item exists in any block
        const { blockId } = findItemById(currentBlocks, deletedMateria.id);
        
        // If not found in any block, no need to update
        if (!blockId) {
          logger.debug(`Item ${deletedMateria.id} not found for deletion`);
          return currentBlocks;
        }
        
        // Remove the item from its block
        return currentBlocks.map(block => {
          if (block.id === blockId) {
            const updatedItems = block.items.filter(item => item.id !== deletedMateria.id);
            return {
              ...block,
              items: updatedItems,
              totalTime: calculateBlockTotalTime(updatedItems)
            };
          }
          return block;
        });
      } catch (error) {
        logger.error('Error processing materia deletion:', error);
        return currentBlocks;
      }
    });
  };
  
  // Helper functions for various materia operations
  
  // Add a new materia to its block
  const addNewMateriaToBlock = (blocks: BlockWithItems[], materia: Materia): BlockWithItems[] => {
    try {
      // Find the block where this materia should be added
      const targetBlock = blocks.find(block => block.id === materia.bloco_id);
      
      // If block not found, no changes needed
      if (!targetBlock) {
        logger.warn(`Block ${materia.bloco_id} not found for item ${materia.id}`);
        return blocks;
      }
      
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
    } catch (error) {
      logger.error('Error adding materia to block:', error);
      return blocks;
    }
  };
  
  // Move a materia from one block to another
  const moveMateriaToNewBlock = (
    blocks: BlockWithItems[], 
    updatedMateria: Materia, 
    sourceBlockId: string
  ): BlockWithItems[] => {
    try {
      logger.info(`Item ${updatedMateria.id} moved from block ${sourceBlockId} to ${updatedMateria.bloco_id}`);
      
      // Make sure both source and destination blocks exist
      const sourceBlock = blocks.find(block => block.id === sourceBlockId);
      const destBlock = blocks.find(block => block.id === updatedMateria.bloco_id);
      
      if (!sourceBlock || !destBlock) {
        logger.warn(`Source or destination block not found for move operation`);
        return updateExistingMateria(blocks, updatedMateria);
      }
      
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
    } catch (error) {
      logger.error('Error moving materia between blocks:', error);
      return blocks; 
    }
  };
  
  // Update an existing materia in its current block with improved efficiency
  const updateExistingMateria = (
    blocks: BlockWithItems[], 
    updatedMateria: Materia
  ): BlockWithItems[] => {
    try {
      // Immediately process the materia to ensure format consistency
      const processedMateria = processUpdatedMateria(updatedMateria);
      
      return blocks.map(block => {
        // Check if this materia belongs to this block
        const hasMateria = block.items.some(item => item.id === updatedMateria.id);
        
        // If this block has the materia or if the updated materia has this block's ID
        if (hasMateria || block.id === updatedMateria.bloco_id) {
          // Shallow copy the items array for comparison
          const updatedItems = block.items.map(item => 
            item.id === updatedMateria.id ? processedMateria : item
          );
          
          // If no change was needed (item wasn't in this block)
          if (updatedItems.length === block.items.length && 
              !updatedItems.some(item => item.id === updatedMateria.id)) {
            return block;
          }
          
          // Only create a new block if there were actual changes
          return updateBlockItems(block, updatedItems);
        }
        return block;
      });
    } catch (error) {
      logger.error('Error updating existing materia:', error);
      return blocks;
    }
  };
  
  return {
    handleMateriaUpdate,
    handleMateriaInsert,
    handleMateriaDelete,
    updateExistingMateria // Export for direct access
  };
};
