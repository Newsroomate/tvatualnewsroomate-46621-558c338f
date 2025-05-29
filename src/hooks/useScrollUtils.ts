
import { useRef } from "react";

export const useScrollUtils = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Function to scroll to bottom with smooth animation
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Function to scroll to a specific block
  const scrollToBlock = (blockId: string) => {
    setTimeout(() => {
      const blockElement = document.querySelector(`[data-block-id="${blockId}"]`);
      if (blockElement && scrollContainerRef.current) {
        blockElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end',
          inline: 'nearest'
        });
      }
    }, 100);
  };

  return {
    scrollContainerRef,
    scrollToBottom,
    scrollToBlock
  };
};
