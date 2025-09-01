
import { useEffect, useRef, useCallback } from 'react';
import { Materia, Bloco } from '@/types';

interface UseTeleprompterKeyboardControlsProps {
  blocks: (Bloco & { items: Materia[] })[];
  contentRef: React.RefObject<HTMLDivElement>;
  isPlaying: boolean;
  onPlayPause: () => void;
  fontSize: number;
  setScrollPosition?: (position: number) => void;
  pauseAutoScroll?: () => void;
  resumeAutoScroll?: () => void;
}

export const useTeleprompterKeyboardControls = ({
  blocks,
  contentRef,
  isPlaying,
  onPlayPause,
  fontSize,
  setScrollPosition,
  pauseAutoScroll,
  resumeAutoScroll
}: UseTeleprompterKeyboardControlsProps) => {
  const currentRetrancaIndex = useRef(0);
  const isNavigating = useRef(false);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get all retrancas in order
  const getAllRetrancas = useCallback(() => {
    const sortedBlocks = [...blocks].sort((a, b) => a.ordem - b.ordem);
    const allRetrancas: Array<{ materia: Materia; element: Element | null }> = [];
    
    sortedBlocks.forEach(block => {
      const sortedMaterias = [...block.items]
        .filter(materia => materia.status === 'approved') // Filter only approved materials
        .sort((a, b) => a.ordem - b.ordem);
      sortedMaterias.forEach(materia => {
        const element = document.querySelector(`[data-retranca-id="${materia.id}"]`);
        allRetrancas.push({ materia, element });
      });
    });
    
    console.log(`Found ${allRetrancas.length} approved retrancas:`, 
      allRetrancas.map(r => ({ 
        id: r.materia.id, 
        retranca: r.materia.retranca, 
        hasElement: !!r.element 
      }))
    );
    
    return allRetrancas;
  }, [blocks]);

  // Get current visible retranca index based on scroll position
  const getCurrentVisibleRetrancaIndex = useCallback(() => {
    if (!contentRef.current) return 0;
    
    const container = contentRef.current;
    const containerTop = container.scrollTop;
    const viewportMiddle = containerTop + (container.clientHeight / 4); // Use top quarter for better UX
    
    const retrancas = getAllRetrancas();
    let closestIndex = 0;
    let closestDistance = Infinity;
    
    retrancas.forEach((retranca, index) => {
      if (retranca.element) {
        const elementTop = (retranca.element as HTMLElement).offsetTop;
        const distance = Math.abs(elementTop - viewportMiddle);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      }
    });
    
    return closestIndex;
  }, [getAllRetrancas, contentRef]);

  // Navigate to specific retranca
  const navigateToRetranca = useCallback((index: number) => {
    const retrancas = getAllRetrancas();
    if (index < 0 || index >= retrancas.length || !contentRef.current) {
      console.log(`Navigation cancelled: index ${index} out of bounds (0-${retrancas.length - 1})`);
      return;
    }

    const targetRetranca = retrancas[index];
    if (!targetRetranca.element) {
      console.log(`Navigation cancelled: element not found for index ${index}`);
      return;
    }

    // Pause auto-scroll during navigation
    isNavigating.current = true;
    if (pauseAutoScroll) {
      pauseAutoScroll();
    }

    const container = contentRef.current;
    const element = targetRetranca.element as HTMLElement;
    
    // Use scrollIntoView for smoother, more reliable scrolling
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest'
    });

    currentRetrancaIndex.current = index;
    
    // Clear existing timeout
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }
    
    // Update scroll position after animation completes and resume auto-scroll if needed
    navigationTimeoutRef.current = setTimeout(() => {
      if (setScrollPosition && container) {
        setScrollPosition(container.scrollTop);
      }
      isNavigating.current = false;
      
      // Resume auto-scroll if it was playing
      if (resumeAutoScroll && isPlaying) {
        resumeAutoScroll();
      }
    }, 500);

    console.log(`Navigated to retranca ${index + 1}/${retrancas.length}: "${targetRetranca.materia.retranca}"`);
  }, [getAllRetrancas, contentRef, setScrollPosition, pauseAutoScroll, resumeAutoScroll, isPlaying]);

  // Navigate to previous retranca
  const goToPreviousRetranca = useCallback(() => {
    // Update current index based on actual scroll position first
    if (!isNavigating.current) {
      currentRetrancaIndex.current = getCurrentVisibleRetrancaIndex();
    }
    
    const newIndex = Math.max(0, currentRetrancaIndex.current - 1);
    console.log(`Going to previous retranca: ${currentRetrancaIndex.current} -> ${newIndex}`);
    navigateToRetranca(newIndex);
  }, [navigateToRetranca, getCurrentVisibleRetrancaIndex]);

  // Navigate to next retranca
  const goToNextRetranca = useCallback(() => {
    // Update current index based on actual scroll position first
    if (!isNavigating.current) {
      currentRetrancaIndex.current = getCurrentVisibleRetrancaIndex();
    }
    
    const retrancas = getAllRetrancas();
    const newIndex = Math.min(retrancas.length - 1, currentRetrancaIndex.current + 1);
    console.log(`Going to next retranca: ${currentRetrancaIndex.current} -> ${newIndex}`);
    navigateToRetranca(newIndex);
  }, [getAllRetrancas, navigateToRetranca, getCurrentVisibleRetrancaIndex]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent handling if user is typing in an input field
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true'
      )) {
        return;
      }

      console.log('Teleprompter keyboard event:', event.key);

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          console.log('Arrow Left pressed - going to previous retranca');
          goToPreviousRetranca();
          break;
        case 'ArrowRight':
          event.preventDefault();
          console.log('Arrow Right pressed - going to next retranca');
          goToNextRetranca();
          break;
        case ' ':
          event.preventDefault();
          console.log('Space pressed - toggling play/pause');
          onPlayPause();
          break;
      }
    };

    console.log('Adding keyboard event listener for teleprompter');
    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      console.log('Removing keyboard event listener for teleprompter');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [blocks, isPlaying, onPlayPause, goToPreviousRetranca, goToNextRetranca]);

  // Reset current index when blocks change
  useEffect(() => {
    currentRetrancaIndex.current = 0;
    isNavigating.current = false;
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
  }, [blocks]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  return {
    currentRetrancaIndex: currentRetrancaIndex.current,
    goToPreviousRetranca,
    goToNextRetranca,
    navigateToRetranca,
    getCurrentVisibleRetrancaIndex,
    isNavigating: isNavigating.current
  };
};
