
import { useState, useEffect, useRef } from "react";
import { TeleprompterControls } from "@/components/news-schedule/teleprompter/TeleprompterControls";
import { TeleprompterViewControls } from "@/components/news-schedule/teleprompter/TeleprompterViewControls";
import { TeleprompterExport } from "@/components/news-schedule/teleprompter/TeleprompterExport";
import { TeleprompterContent } from "@/components/news-schedule/teleprompter/TeleprompterContent";
import { Materia, Telejornal, Bloco } from "@/types";

const TeleprompterWindow = () => {
  const [blocks, setBlocks] = useState<(Bloco & { items: Materia[] })[]>([]);
  const [telejornal, setTelejornal] = useState<Telejornal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState([50]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [fontSize, setFontSize] = useState(24);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasReceivedDataRef = useRef(false);

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
  }, []);

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
  }, []);

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
  }, [isPlaying, speed]);

  // Apply scroll position
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition]);

  const handlePlayPause = () => {
    console.log("Play/Pause toggled:", !isPlaying);
    setIsPlaying(!isPlaying);
  };

  const handleSpeedChange = (value: number[]) => {
    console.log("Speed changed to:", value[0]);
    setSpeed(value);
  };

  const resetPosition = () => {
    console.log("Resetting position to top");
    setScrollPosition(0);
    setIsPlaying(false);
  };

  const increaseFontSize = () => {
    setFontSize(prev => {
      const newSize = Math.min(prev + 2, 200);
      console.log("Font size increased to:", newSize);
      return newSize;
    });
  };

  const decreaseFontSize = () => {
    setFontSize(prev => {
      const newSize = Math.max(prev - 2, 12);
      console.log("Font size decreased to:", newSize);
      return newSize;
    });
  };

  const handleFontSizeChange = (newSize: number) => {
    const clampedSize = Math.max(12, Math.min(200, newSize));
    setFontSize(clampedSize);
    console.log("Font size manually changed to:", clampedSize);
  };

  // Show loading only for a brief moment initially
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-xl font-bold mb-2">Carregando Teleprompter...</div>
          <div className="text-gray-600">Aguarde um momento</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header - Hidden in fullscreen */}
      {!isFullscreen && (
        <div className="bg-gray-100 border-b p-4">
          <h1 className="text-xl font-bold">
            Teleprompter - {telejornal?.nome || "Sem Telejornal Selecionado"}
          </h1>
        </div>
      )}
      
      {/* Controls - Hidden in fullscreen */}
      {!isFullscreen && (
        <div className="flex items-center gap-4 p-4 border-b bg-gray-50">
          <TeleprompterControls
            isPlaying={isPlaying}
            speed={speed}
            onPlayPause={handlePlayPause}
            onSpeedChange={handleSpeedChange}
            onReset={resetPosition}
          />

          <TeleprompterViewControls
            fontSize={fontSize}
            onIncreaseFontSize={increaseFontSize}
            onDecreaseFontSize={decreaseFontSize}
            onFontSizeChange={handleFontSizeChange}
          />

          <TeleprompterExport
            blocks={blocks}
            telejornal={telejornal}
          />

          <button
            onClick={() => window.close()}
            className="ml-auto px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Teleprompter Content */}
      <div className="flex-1 overflow-hidden">
        <TeleprompterContent
          ref={contentRef}
          blocks={blocks}
          fontSize={fontSize}
        />
      </div>
    </div>
  );
};

export default TeleprompterWindow;
