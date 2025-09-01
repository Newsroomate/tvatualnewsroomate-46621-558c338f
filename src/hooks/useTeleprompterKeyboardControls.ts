
import { useEffect, useRef } from 'react';
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
  const getAllRetrancas = () => {
    const sortedBlocks = [...blocks].sort((a, b) => a.ordem - b.ordem);
    const allRetrancas: Array<{ materia: Materia; element: Element | null }> = [];
    
    sortedBlocks.forEach(block => {
      const sortedMaterias = [...block.items].sort((a, b) => a.ordem - b.ordem);
      sortedMaterias.forEach(materia => {
        const element = document.querySelector(`[data-retranca-id="${materia.id}"]`);
        allRetrancas.push({ materia, element });
      });
    });
    
    return allRetrancas;
  };

  // Navigate to specific retranca
  const navigateToRetranca = (index: number) => {
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
  };

  // Navigate to previous retranca
  const goToPreviousRetranca = () => {
    const newIndex = Math.max(0, currentRetrancaIndex.current - 1);
    navigateToRetranca(newIndex);
  };

  // Navigate to next retranca
  const goToNextRetranca = () => {
    const retrancas = getAllRetrancas();
    const newIndex = Math.min(retrancas.length - 1, currentRetrancaIndex.current + 1);
    navigateToRetranca(newIndex);
  };

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

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          goToPreviousRetranca();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNextRetranca();
          break;
        case ' ':
          event.preventDefault();
          onPlayPause();
          break;
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [blocks, isPlaying, onPlayPause]);

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
