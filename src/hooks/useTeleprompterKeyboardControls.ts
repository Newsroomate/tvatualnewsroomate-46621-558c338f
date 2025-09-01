
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
    
    console.log(`Processing ${sortedBlocks.length} blocks for navigation`);
    
    sortedBlocks.forEach((block, blockIndex) => {
      const sortedMaterias = [...block.items]
        .sort((a, b) => a.ordem - b.ordem)
        .filter(materia => {
          // Same filter as TeleprompterContent - allow multiple statuses
          const allowedStatuses = ['approved', 'published', 'ready', 'draft'];
          return allowedStatuses.includes(materia.status || 'draft');
        });
      
      console.log(`Block ${blockIndex + 1} "${block.nome}" has ${sortedMaterias.length} filtered materias`);
      
      sortedMaterias.forEach((materia, materiaIndex) => {
        const element = document.querySelector(`[data-retranca-id="${materia.id}"]`);
        console.log(`Materia ${materiaIndex + 1} (ID: ${materia.id}, Retranca: ${materia.retranca}): ${element ? 'Found' : 'NOT FOUND'}`);
        allRetrancas.push({ materia, element });
      });
    });
    
    console.log(`Total retrancas for navigation: ${allRetrancas.length}`);
    return allRetrancas;
  };

  // Navigate to specific retranca
  const navigateToRetranca = (index: number) => {
    const retrancas = getAllRetrancas();
    console.log(`Total retrancas found: ${retrancas.length}`);
    if (index < 0 || index >= retrancas.length || !contentRef.current) return;

    const targetRetranca = retrancas[index];
    if (!targetRetranca.element) {
      console.log(`No element found for retranca ${index}`);
      return;
    }

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
    console.log(`✅ Successfully navigated to retranca ${index + 1}/${retrancas.length}: "${targetRetranca.materia.retranca}"`);
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
      console.log(`Key pressed: ${event.key}`);
      
      // Prevent handling if user is typing in an input field
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true'
      )) {
        console.log('Ignoring key press - user is typing in input field');
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          console.log('Arrow Left pressed - going to previous retranca');
          event.preventDefault();
          goToPreviousRetranca();
          break;
        case 'ArrowRight':
          console.log('Arrow Right pressed - going to next retranca');
          event.preventDefault();
          goToNextRetranca();
          break;
        case ' ':
          console.log('Space pressed - toggling play/pause');
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
