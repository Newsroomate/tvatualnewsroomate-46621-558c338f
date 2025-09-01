
import { useEffect } from "react";
import { Materia, Telejornal, Bloco } from "@/types";

interface UseTeleprompterWindowEffectsProps {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setBlocks: (blocks: (Bloco & { items: Materia[] })[]) => void;
  setTelejornal: (telejornal: Telejornal | null) => void;
  hasReceivedDataRef: React.MutableRefObject<boolean>;
  setIsFullscreen: (fullscreen: boolean) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  speed: number[];
  setScrollPosition: (position: number | ((prev: number) => number)) => void;
  intervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
  animationFrameRef?: React.MutableRefObject<number | null>;
  lastTimeRef?: React.MutableRefObject<number>;
  contentRef: React.MutableRefObject<HTMLDivElement | null>;
  scrollPosition: number;
}

export const useTeleprompterWindowEffects = ({
  isLoading,
  setIsLoading,
  setBlocks,
  setTelejornal,
  hasReceivedDataRef,
  setIsFullscreen,
  isPlaying,
  setIsPlaying,
  speed,
  setScrollPosition,
  intervalRef,
  contentRef,
  scrollPosition,
  animationFrameRef,
  lastTimeRef
}: UseTeleprompterWindowEffectsProps) => {
  // Listen for data from parent window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log("Teleprompter window received message:", event.data);
      
      if (event.data.type === 'TELEPROMPTER_DATA') {
        setBlocks(event.data.blocks || []);
        setTelejornal(event.data.telejornal || null);
        setIsLoading(false);
        hasReceivedDataRef.current = true;
        console.log("Updated teleprompter data:", {
          blocks: event.data.blocks,
          telejornal: event.data.telejornal
        });
      }
      if (event.data.type === 'TELEPROMPTER_UPDATE') {
        setBlocks(event.data.blocks || []);
        console.log("Updated teleprompter blocks:", event.data.blocks);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Notify parent that we're ready immediately when component mounts
    const notifyReady = () => {
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage({ type: 'TELEPROMPTER_READY' }, '*');
          console.log("Teleprompter window notified parent that it's ready");
        } catch (error) {
          console.error("Error notifying parent window:", error);
        }
      }
    };

    // Notify immediately and retry multiple times to ensure connection
    notifyReady();
    const readyTimeout1 = setTimeout(notifyReady, 50);
    const readyTimeout2 = setTimeout(notifyReady, 150);

    // Set a shorter timeout to stop loading state if no data is received
    const loadingTimeout = setTimeout(() => {
      if (!hasReceivedDataRef.current) {
        console.log("No data received within timeout, stopping loading state");
        setIsLoading(false);
      }
    }, 1000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(readyTimeout1);
      clearTimeout(readyTimeout2);
      clearTimeout(loadingTimeout);
    };
  }, [setBlocks, setTelejornal, setIsLoading, hasReceivedDataRef]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      
      setIsFullscreen(isCurrentlyFullscreen);
      console.log("Fullscreen mode:", isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [setIsFullscreen]);

  // Handle F11 key for fullscreen toggle
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F11') {
        event.preventDefault();
        
        if (!document.fullscreenElement) {
          // Enter fullscreen
          document.documentElement.requestFullscreen().catch(err => {
            console.error('Error attempting to enable fullscreen:', err);
          });
        } else {
          // Exit fullscreen
          document.exitFullscreen().catch(err => {
            console.error('Error attempting to exit fullscreen:', err);
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Auto-scroll logic with smooth requestAnimationFrame
  useEffect(() => {
    const animate = (currentTime: number) => {
      const contentElement = contentRef.current;
      if (!contentElement || !isPlaying) return;

      if (lastTimeRef?.current !== undefined) {
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
        
        // Continue animation
        if (isPlaying && animationFrameRef?.current !== undefined) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      }
    };

    if (isPlaying && contentRef.current && animationFrameRef && lastTimeRef) {
      lastTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef?.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }

    return () => {
      if (animationFrameRef?.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, speed, setIsPlaying, animationFrameRef, contentRef, lastTimeRef]);

  // Debounced scroll sync for manual scrolling
  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) return;

    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      // Only update state if not auto-scrolling to avoid conflicts
      if (!isPlaying) {
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
  }, [isPlaying, setScrollPosition]);

  // Apply scroll position only when not playing (to avoid conflicts during auto-scroll)
  useEffect(() => {
    if (!isPlaying && contentRef.current) {
      contentRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition, isPlaying]);
};
