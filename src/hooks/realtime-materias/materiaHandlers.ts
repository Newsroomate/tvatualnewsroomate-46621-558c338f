
import { Materia } from "@/types";
import { BlockWithItems } from "./types";
import { processUpdatedMateria, calculateBlockTotalTime } from "@/components/news-schedule/utils";

/**
 * Utility functions for handling materia operations in realtime
 */
export const materiaHandlers = {
  /**
   * Insert materia in correct position based on ordem
   */
  insertMateriaInOrder: (items: Materia[], newMateria: Materia): Materia[] => {
    const newOrder = newMateria.ordem || 0;
    
    // Sort existing items by order
    const sortedItems = [...items].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    
    // Find the correct position to insert based on order
    const insertIndex = sortedItems.findIndex(item => (item.ordem || 0) > newOrder);
    
    if (insertIndex === -1) {
      // Insert at the end if no item has a higher order
      return [...sortedItems, newMateria];
    } else {
      // Insert at the correct position
      const updatedItems = [...sortedItems];
      updatedItems.splice(insertIndex, 0, newMateria);
      return updatedItems;
    }
  },

  /**
   * Ensure items are always sorted by ordem
   */
  sortItemsByOrder: (items: Materia[]): Materia[] => {
    return [...items].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  },

  /**
   * Handle materia update/insert operations
   */
  handleMateriaUpdate: (
    currentBlocks: BlockWithItems[], 
    updatedMateria: Materia, 
    isInsert = false
  ): BlockWithItems[] => {
    return currentBlocks.map(block => {
      // Find the block that contains this materia
      if (block.id === updatedMateria.bloco_id) {
        let updatedItems;
        
        if (isInsert) {
          // For inserts, check if the materia already exists (avoid duplicates)
          const itemExists = block.items.some(item => item.id === updatedMateria.id);
          
          if (!itemExists) {
            // Check if this is replacing a temporary item
            const tempMateriaIndex = block.items.findIndex(item => 
              item.id.toString().startsWith('temp-') && 
              Math.abs((item.ordem || 0) - (updatedMateria.ordem || 0)) < 0.5
            );
            
            if (tempMateriaIndex !== -1) {
              // Replace the temporary materia with the real one
              updatedItems = [...block.items];
              updatedItems[tempMateriaIndex] = processUpdatedMateria(updatedMateria);
            } else {
              // Insert the new materia in the correct position based on order
              updatedItems = materiaHandlers.insertMateriaInOrder(
                block.items, 
                processUpdatedMateria(updatedMateria)
              );
            }
            
            // Always sort by order to ensure consistency
            updatedItems = materiaHandlers.sortItemsByOrder(updatedItems);
          } else {
            updatedItems = block.items;
          }
        } else {
          // For updates, find and update the existing materia
          const itemExists = block.items.some(item => item.id === updatedMateria.id);
          
          if (itemExists) {
            // Update the existing materia and re-sort if ordem changed
            updatedItems = block.items.map(item => 
              item.id === updatedMateria.id 
                ? processUpdatedMateria(updatedMateria)
                : item
            );
            // Ensure items are still sorted by ordem
            updatedItems = materiaHandlers.sortItemsByOrder(updatedItems);
          } else {
            // This is a new materia for this block (moved from another block)
            updatedItems = materiaHandlers.insertMateriaInOrder(
              block.items, 
              processUpdatedMateria(updatedMateria)
            );
          }
        }
        
        // Calculate new total time
        const totalTime = calculateBlockTotalTime(updatedItems);
        
        // Return updated block
        return {
          ...block,
          items: updatedItems,
          totalTime
        };
      } else {
        // Check if this materia was moved FROM this block (for updates)
        if (!isInsert) {
          const materiaIndex = block.items.findIndex(item => item.id === updatedMateria.id);
          if (materiaIndex !== -1) {
            // Remove the materia from this block as it moved to another block
            const updatedItems = block.items.filter(item => item.id !== updatedMateria.id);
            const totalTime = calculateBlockTotalTime(updatedItems);
            
            return {
              ...block,
              items: updatedItems,
              totalTime
            };
          }
        }
      }
      return block;
    });
  }
};
