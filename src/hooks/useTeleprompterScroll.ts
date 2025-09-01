import { useEffect } from "react";

interface UseTeleprompterScrollProps {
  isPlaying: boolean;
  isNavigating: boolean;
  speed: number[];
  scrollPosition: number;
  setScrollPosition: (position: number) => void;
  setIsPlaying: (playing: boolean) => void;
  contentRef: React.MutableRefObject<HTMLDivElement | null>;
  animationFrameRef: React.MutableRefObject<number | null>;
  lastTimeRef: React.MutableRefObject<number>;
}

export const useTeleprompterScroll = ({
  isPlaying,
  isNavigating,
  speed,
  scrollPosition,
  setScrollPosition,
  setIsPlaying,
  contentRef,
  animationFrameRef,
  lastTimeRef
}: UseTeleprompterScrollProps) => {
  // Auto-scroll logic with smooth requestAnimationFrame
  useEffect(() => {
    const animate = (currentTime: number) => {
      const contentElement = contentRef.current;
      if (!contentElement || !isPlaying || isNavigating) return;

      if (lastTimeRef.current !== undefined) {
        const deltaTime = currentTime - lastTimeRef.current;
        lastTimeRef.current = currentTime;

        // Calculate smooth scroll speed based on time elapsed
        const scrollSpeed = (speed[0] / 10) * (deltaTime / 16.67); // Normalize to 60fps
        
        const currentScrollTop = contentElement.scrollTop;
        const maxScroll = contentElement.scrollHeight - contentElement.clientHeight;
        
        const nextPosition = currentScrollTop + scrollSpeed;
        
        if (nextPosition >= maxScroll) {
          console.log("Reached end of content, stopping playback");
          setIsPlaying(false);
          return;
        }
        
        // Update DOM directly for smooth scrolling
        contentElement.scrollTop = nextPosition;
        
        // Update scroll position state for persistence
        setScrollPosition(nextPosition);
        
        // Continue animation
        if (isPlaying && !isNavigating && animationFrameRef.current !== undefined) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      }
    };

    if (isPlaying && !isNavigating && contentRef.current) {
      lastTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, isNavigating, speed, setIsPlaying, setScrollPosition, animationFrameRef, contentRef, lastTimeRef]);

  // Debounced scroll sync for manual scrolling
  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) return;

    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      // Only update state if not auto-scrolling and not navigating to avoid conflicts
      if (!isPlaying && !isNavigating) {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          const currentScrollTop = contentElement.scrollTop;
          setScrollPosition(currentScrollTop);
        }, 50);
      }
    };

    contentElement.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      contentElement.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [isPlaying, isNavigating, setScrollPosition]);

  // Apply scroll position only when not playing and not navigating
  useEffect(() => {
    if (!isPlaying && !isNavigating && contentRef.current && scrollPosition > 0) {
      console.log('Applying scroll position:', scrollPosition);
      contentRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition, isPlaying, isNavigating]);
};