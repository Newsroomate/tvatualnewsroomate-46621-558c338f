
import { useRef } from "react";

export const useScrollToBottom = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const scrollToBlock = (blockId: string) => {
    const blockElement = document.querySelector(`[data-block-id="${blockId}"]`);
    if (blockElement && scrollContainerRef.current) {
      blockElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'end',
        inline: 'nearest'
      });
    }
  };

  return {
    scrollContainerRef,
    scrollToBottom,
    scrollToBlock
  };
};
