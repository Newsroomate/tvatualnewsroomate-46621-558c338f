
import { useRef } from 'react';
import { logger } from './utils';

interface MoveOperation {
  timestamp: number;
  sourceBlock: string;
  destBlock: string;
}

export const useDragTracker = () => {
  // Track if a drag operation is in progress
  const isDraggingRef = useRef(false);
  
  // Track recently moved items to prevent duplicate updates
  const recentlyMovedItemsRef = useRef<Map<string, MoveOperation>>(new Map());
  
  // Track the current drag operation details
  const dragOperationInProgressRef = useRef<{
    itemId: string; 
    sourceBlock: string; 
    destBlock: string;
  } | null>(null);
  
  // Track recently edited items
  const recentlyEditedItemsRef = useRef<Set<string>>(new Set());
  
  // Start a drag operation
  const startDragging = () => {
    isDraggingRef.current = true;
    logger.info('Drag operation started');
  };
  
  // End a drag operation with enhanced tracking
  const endDragging = (itemId?: string, sourceBlockId?: string, destBlockId?: string) => {
    if (itemId && sourceBlockId && destBlockId) {
      logger.info(`Drag operation completed: Item ${itemId} moved from ${sourceBlockId} to ${destBlockId}`);
      
      // Store context about the move for temporary protection against realtime updates
      recentlyMovedItemsRef.current.set(itemId, {
        timestamp: Date.now(),
        sourceBlock: sourceBlockId,
        destBlock: destBlockId
      });
      
      // Reduced from 3 seconds to 1.5 seconds for faster UI updates
      setTimeout(() => {
        if (recentlyMovedItemsRef.current.has(itemId)) {
          logger.debug(`Removing ${itemId} from recently moved items buffer`);
          recentlyMovedItemsRef.current.delete(itemId);
        }
      }, 1500);
    } else {
      logger.debug('Drag operation completed without item details');
    }
    
    isDraggingRef.current = false;
    dragOperationInProgressRef.current = null;
  };
  
  // Track details of the current drag operation
  const trackDragOperation = (itemId: string, sourceBlockId: string, destBlockId: string) => {
    dragOperationInProgressRef.current = { 
      itemId, 
      sourceBlock: sourceBlockId, 
      destBlock: destBlockId 
    };
    logger.debug(`Tracking drag operation: Item ${itemId} from ${sourceBlockId} to ${destBlockId}`);
  };

  // Mark an item as recently edited
  const markItemAsEdited = (materiaId: string) => {
    recentlyEditedItemsRef.current.add(materiaId);
    logger.debug(`Marked item ${materiaId} as recently edited`);
    
    // Remove from edited items after 1.5 seconds
    setTimeout(() => {
      if (recentlyEditedItemsRef.current.has(materiaId)) {
        recentlyEditedItemsRef.current.delete(materiaId);
        logger.debug(`Removed ${materiaId} from recently edited items buffer`);
      }
    }, 1500);
  };
  
  // Determine if realtime updates for an item should be ignored
  const shouldIgnoreRealtimeUpdate = (materiaId: string): boolean => {
    // If we're currently dragging, ignore all updates
    if (isDraggingRef.current) {
      logger.debug(`Ignoring update for ${materiaId} because drag is in progress`);
      return true;
    }
    
    // If this is an item we just edited, ignore the update
    if (recentlyEditedItemsRef.current.has(materiaId)) {
      logger.debug(`Ignoring update for recently edited item ${materiaId}`);
      return true;
    }
    
    // Check if this item was recently moved by the user
    if (recentlyMovedItemsRef.current.has(materiaId)) {
      const moveInfo = recentlyMovedItemsRef.current.get(materiaId);
      
      // Only ignore updates if they appear to be related to our move operation
      // Reduced ignore window from 3 seconds to 1.5 seconds
      if (moveInfo && (Date.now() - moveInfo.timestamp < 1500)) {
        logger.debug(`Ignoring update for recently moved item ${materiaId}`);
        return true;
      }
    }
    
    return false;
  };
  
  return {
    startDragging,
    endDragging,
    trackDragOperation,
    shouldIgnoreRealtimeUpdate,
    markItemAsEdited
  };
};
