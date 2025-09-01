import { useEffect, useRef, useCallback } from "react";
import { Materia, Bloco } from "@/types";
import { getOrderedApprovedMaterias } from "@/utils/teleprompter-utils";

interface UseTeleprompterNavigationProps {
  blocks: (Bloco & { items: Materia[] })[];
  contentRef: React.MutableRefObject<HTMLDivElement | null>;
  pauseAutoScroll: () => void;
  resumeAutoScroll: () => void;
}

export const useTeleprompterNavigation = ({
  blocks,
  contentRef,
  pauseAutoScroll,
  resumeAutoScroll
}: UseTeleprompterNavigationProps) => {
  const currentRetrancaIndexRef = useRef<number>(0);
  const isNavigatingRef = useRef(false);

  // Get all approved retrancas for navigation
  const getAllRetrancas = useCallback(() => {
    const approvedMaterias = getOrderedApprovedMaterias(blocks);
    return approvedMaterias.map(materia => ({
      id: materia.id,
      retranca: materia.retranca || `Matéria ${materia.ordem}`,
      element: document.querySelector(`[data-retranca-id="${materia.id}"]`) as HTMLElement
    })).filter(item => item.element);
  }, [blocks]);

  // Get current visible retranca index based on scroll position
  const getCurrentVisibleRetrancaIndex = useCallback(() => {
    const contentElement = contentRef.current;
    if (!contentElement) return 0;

    const retrancas = getAllRetrancas();
    if (retrancas.length === 0) return 0;

    const scrollTop = contentElement.scrollTop;
    const windowHeight = contentElement.clientHeight;
    const centerPosition = scrollTop + windowHeight / 2;

    // Find the retranca closest to the center of the viewport
    let closestIndex = 0;
    let closestDistance = Math.abs(retrancas[0].element.offsetTop - centerPosition);

    for (let i = 1; i < retrancas.length; i++) {
      const distance = Math.abs(retrancas[i].element.offsetTop - centerPosition);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    }

    return closestIndex;
  }, [getAllRetrancas, contentRef]);

  // Navigate to specific retranca - without interrupting auto-scroll
  const navigateToRetranca = useCallback((index: number) => {
    const retrancas = getAllRetrancas();
    if (index < 0 || index >= retrancas.length || !contentRef.current) return;

    console.log(`Navigating to retranca ${index + 1}/${retrancas.length}: ${retrancas[index].retranca}`);
    
    // Brief pause for navigation, then continue scrolling
    isNavigatingRef.current = true;
    pauseAutoScroll();

    // Instant scroll to element to avoid conflicts with auto-scroll
    retrancas[index].element.scrollIntoView({
      behavior: 'instant',
      block: 'center'
    });

    currentRetrancaIndexRef.current = index;

    // Quick resume of auto-scroll without long pause
    setTimeout(() => {
      isNavigatingRef.current = false;
      resumeAutoScroll();
    }, 200);
  }, [getAllRetrancas, contentRef, pauseAutoScroll, resumeAutoScroll]);

  // Navigate to previous retranca
  const goToPreviousRetranca = useCallback(() => {
    const retrancas = getAllRetrancas();
    if (retrancas.length === 0) return;

    let targetIndex = getCurrentVisibleRetrancaIndex() - 1;
    if (targetIndex < 0) targetIndex = 0;

    navigateToRetranca(targetIndex);
  }, [getAllRetrancas, getCurrentVisibleRetrancaIndex, navigateToRetranca]);

  // Navigate to next retranca
  const goToNextRetranca = useCallback(() => {
    const retrancas = getAllRetrancas();
    if (retrancas.length === 0) return;

    let targetIndex = getCurrentVisibleRetrancaIndex() + 1;
    if (targetIndex >= retrancas.length) targetIndex = retrancas.length - 1;

    navigateToRetranca(targetIndex);
  }, [getAllRetrancas, getCurrentVisibleRetrancaIndex, navigateToRetranca]);

  // Focus on specific materia
  const focusOnMateria = useCallback((materiaId: string) => {
    console.log("Focusing on materia:", materiaId);
    
    const retrancas = getAllRetrancas();
    const targetIndex = retrancas.findIndex(retranca => retranca.id === materiaId);
    
    if (targetIndex !== -1) {
      navigateToRetranca(targetIndex);
      return true;
    } else {
      console.warn("Materia not found for focus:", materiaId);
      return false;
    }
  }, [getAllRetrancas, navigateToRetranca]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore keyboard events if focus is on input elements
      const target = event.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
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
          // Let parent handle spacebar for play/pause
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToPreviousRetranca, goToNextRetranca]);

  // Reset navigation state when blocks change
  useEffect(() => {
    currentRetrancaIndexRef.current = 0;
    isNavigatingRef.current = false;
  }, [blocks]);

  return {
    navigateToRetranca,
    goToPreviousRetranca,
    goToNextRetranca,
    focusOnMateria,
    getAllRetrancas,
    getCurrentVisibleRetrancaIndex
  };
};