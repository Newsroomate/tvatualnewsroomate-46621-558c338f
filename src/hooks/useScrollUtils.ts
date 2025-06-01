
import { useRef } from "react";

export const useScrollUtils = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Function to scroll to bottom with smooth animation and safety margin
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      // Add extra margin to ensure full visibility
      const targetScrollTop = container.scrollHeight - container.clientHeight + 100;
      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth'
      });
    }
  };

  // Function to scroll to a specific block with improved positioning
  const scrollToBlock = (blockId: string) => {
    setTimeout(() => {
      const blockElement = document.querySelector(`[data-block-id="${blockId}"]`);
      if (blockElement && scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const blockRect = blockElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Calculate optimal scroll position with safety margin
        const targetScrollTop = container.scrollTop + blockRect.top - containerRect.top - 100;
        
        container.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: 'smooth'
        });
      }
    }, 150); // Increased timeout for better DOM update handling
  };

  // Function to ensure element is fully visible
  const ensureElementVisible = (element: HTMLElement) => {
    if (!scrollContainerRef.current || !element) return;
    
    const container = scrollContainerRef.current;
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // Check if element is fully visible
    const isFullyVisible = 
      elementRect.top >= containerRect.top &&
      elementRect.bottom <= containerRect.bottom - 20; // 20px safety margin
    
    if (!isFullyVisible) {
      const targetScrollTop = container.scrollTop + elementRect.top - containerRect.top - 100;
      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth'
      });
    }
  };

  return {
    scrollContainerRef,
    scrollToBottom,
    scrollToBlock,
    ensureElementVisible
  };
};
