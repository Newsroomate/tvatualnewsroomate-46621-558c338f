
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
  scrollPosition
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

    // Notify immediately and also after a short delay to ensure parent is listening
    notifyReady();
    const readyTimeout = setTimeout(notifyReady, 100);

    // Set a timeout to stop loading state even if no data is received
    const loadingTimeout = setTimeout(() => {
      if (!hasReceivedDataRef.current) {
        console.log("No data received within timeout, stopping loading state");
        setIsLoading(false);
      }
    }, 3000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(readyTimeout);
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

  // Auto-scroll logic
  useEffect(() => {
    if (isPlaying && contentRef.current) {
      const scrollSpeed = speed[0] / 10;
      
      intervalRef.current = setInterval(() => {
        setScrollPosition(prev => {
          const contentElement = contentRef.current;
          if (!contentElement) return prev;
          
          const maxScroll = contentElement.scrollHeight - contentElement.clientHeight;
          const newPosition = prev + scrollSpeed;
          
          if (newPosition >= maxScroll) {
            console.log("Reached end of content, stopping playback");
            setIsPlaying(false);
            return prev;
          }
          
          return newPosition;
        });
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, speed, setScrollPosition, setIsPlaying, intervalRef, contentRef]);

  // Apply scroll position
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition]);
};
