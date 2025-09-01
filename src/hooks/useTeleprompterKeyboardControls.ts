
import { useEffect, useRef, useCallback } from 'react';
import { Materia, Bloco } from '@/types';

interface UseTeleprompterKeyboardControlsProps {
  blocks: (Bloco & { items: Materia[] })[];
  contentRef: React.RefObject<HTMLDivElement>;
  isPlaying: boolean;
  onPlayPause: () => void;
  fontSize: number;
  setScrollPosition?: (position: number) => void;
}

export const useTeleprompterKeyboardControls = ({
  blocks,
  contentRef,
  isPlaying,
  onPlayPause,
  fontSize,
  setScrollPosition
}: UseTeleprompterKeyboardControlsProps) => {
  const currentRetrancaIndex = useRef(0);

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

  // Navigate to specific retranca
  const navigateToRetranca = useCallback((index: number) => {
    const retrancas = getAllRetrancas();
    if (index < 0 || index >= retrancas.length || !contentRef.current) return;

    const targetRetranca = retrancas[index];
    if (!targetRetranca.element) return;

    const container = contentRef.current;
    const elementRect = targetRetranca.element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // Calculate scroll position to center the retranca
    const targetScrollTop = container.scrollTop + elementRect.top - containerRect.top - (container.clientHeight / 4);
    const finalScrollTop = Math.max(0, targetScrollTop);
    
    container.scrollTo({
      top: finalScrollTop,
      behavior: 'smooth'
    });

    // Update scroll position state to sync with the new position
    if (setScrollPosition) {
      setTimeout(() => {
        setScrollPosition(finalScrollTop);
      }, 300); // Wait for smooth scroll to complete
    }

    currentRetrancaIndex.current = index;
    console.log(`Navigated to retranca ${index + 1}/${retrancas.length}: ${targetRetranca.materia.retranca}`);
  }, [getAllRetrancas, contentRef, setScrollPosition]);

  // Navigate to previous retranca
  const goToPreviousRetranca = useCallback(() => {
    const newIndex = Math.max(0, currentRetrancaIndex.current - 1);
    navigateToRetranca(newIndex);
  }, [navigateToRetranca]);

  // Navigate to next retranca
  const goToNextRetranca = useCallback(() => {
    const retrancas = getAllRetrancas();
    const newIndex = Math.min(retrancas.length - 1, currentRetrancaIndex.current + 1);
    navigateToRetranca(newIndex);
  }, [getAllRetrancas, navigateToRetranca]);

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
  }, [blocks]);

  return {
    currentRetrancaIndex: currentRetrancaIndex.current,
    goToPreviousRetranca,
    goToNextRetranca,
    navigateToRetranca
  };
};
