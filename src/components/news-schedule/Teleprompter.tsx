
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Materia, Telejornal, Bloco } from "@/types";
import { TeleprompterControls } from "./teleprompter/TeleprompterControls";
import { TeleprompterViewControls } from "./teleprompter/TeleprompterViewControls";
import { TeleprompterColorControls } from "./teleprompter/TeleprompterColorControls";
import { TeleprompterExport } from "./teleprompter/TeleprompterExport";
import { TeleprompterContent } from "./teleprompter/TeleprompterContent";
import { useTeleprompterKeyboardControls } from "@/hooks/useTeleprompterKeyboardControls";
import { useIsMobile } from "@/hooks/use-mobile";

interface TeleprompterProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: (Bloco & { items: Materia[] })[];
  telejornal: Telejornal | null;
}

export const Teleprompter = ({ isOpen, onClose, blocks, telejornal }: TeleprompterProps) => {
  const isMobile = useIsMobile();
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState([50]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [fontSize, setFontSize] = useState(isMobile ? 18 : 24);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cabecaColor, setCabecaColor] = useState("#ffffff");
  const [retrancaColor, setRetrancaColor] = useState("#facc15");
  const [tipoMaterialColor, setTipoMaterialColor] = useState("#f97316");
  const contentRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const { 
    currentRetrancaIndex,
    goToPreviousRetranca, 
    goToNextRetranca,
    navigateToRetranca,
    isNavigating
  } = useTeleprompterKeyboardControls({
    blocks,
    contentRef,
    isPlaying,
    onPlayPause: handlePlayPause,
    fontSize,
    setScrollPosition,
    pauseAutoScroll: () => {
      // Don't change isPlaying state, just add temporary navigation flag
      console.log("Navigation started - temporarily pausing auto-scroll");
    },
    resumeAutoScroll: () => {
      // Resume happens automatically after short timeout
      console.log("Navigation ended - auto-scroll can resume");
    }
  });

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullscreenElement ||
        (document as any).msFullscreenElement
      );
      
      setIsFullscreen(isCurrentlyFullscreen);
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
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F11') {
        event.preventDefault();
        
        const dialogContent = document.querySelector('[role="dialog"]') as HTMLElement;
        
        if (!document.fullscreenElement && dialogContent) {
          // Enter fullscreen
          dialogContent.requestFullscreen().catch(err => {
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
  }, [isOpen]);

  // Auto-scroll effect - only when not manually navigating
  useEffect(() => {
    let animationFrameId: number | null = null;
    let lastTime = 0;

    const autoScroll = (currentTime: number) => {
      if (!isPlaying || !contentRef.current || isNavigating) return;

      if (lastTime === 0) lastTime = currentTime;
      
      const deltaTime = currentTime - lastTime;
      const scrollSpeed = (speed[0] / 100) * 2; // Adjust base scroll speed
      const scrollAmount = (deltaTime / 1000) * scrollSpeed * fontSize;
      
      const container = contentRef.current;
      const newScrollTop = container.scrollTop + scrollAmount;
      
      // Check if we've reached the end
      if (newScrollTop >= container.scrollHeight - container.clientHeight) {
        setIsPlaying(false);
        console.log("Reached end of content, stopping playback");
        return;
      }
      
      container.scrollTop = newScrollTop;
      setScrollPosition(newScrollTop);
      
      lastTime = currentTime;
      
      if (isPlaying && !isNavigating) {
        animationFrameId = requestAnimationFrame(autoScroll);
      }
    };

    if (isPlaying && !isNavigating) {
      lastTime = 0;
      animationFrameId = requestAnimationFrame(autoScroll);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPlaying, speed, fontSize, setScrollPosition, isNavigating]);

  // Debounced scroll synchronization - only when not auto-playing or navigating
  useEffect(() => {
    if (!contentRef.current) return;

    const handleScroll = () => {
      if (!isPlaying && !isNavigating && contentRef.current) {
        const currentScrollTop = contentRef.current.scrollTop;
        setScrollPosition(currentScrollTop);
      }
    };

    let scrollTimeout: NodeJS.Timeout;
    const debouncedScrollHandler = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 100);
    };
    
    const container = contentRef.current;
    container.addEventListener('scroll', debouncedScrollHandler);
    
    return () => {
      container.removeEventListener('scroll', debouncedScrollHandler);
      clearTimeout(scrollTimeout);
    };
  }, [isPlaying, isNavigating, setScrollPosition]);

  // Apply scroll position when not playing and not navigating
  useEffect(() => {
    if (!isPlaying && !isNavigating && contentRef.current) {
      contentRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition, isPlaying, isNavigating]);

  const handleSpeedChange = (value: number[]) => {
    setSpeed(value);
  };

  const resetPosition = () => {
    setScrollPosition(0);
    setIsPlaying(false);
  };

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 200)); // Max font size 200px
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 12)); // Min font size 12px
  };

  const handleFontSizeChange = (newSize: number) => {
    const clampedSize = Math.max(12, Math.min(200, newSize));
    setFontSize(clampedSize);
  };

  const handleCabecaColorChange = (color: string) => {
    setCabecaColor(color);
  };

  const handleRetrancaColorChange = (color: string) => {
    setRetrancaColor(color);
  };

  const handleTipoMaterialColorChange = (color: string) => {
    setTipoMaterialColor(color);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`${
          isMobile 
            ? 'w-full h-full max-w-none max-h-none m-0 p-0 border-0 rounded-none' 
            : 'max-w-4xl h-[80vh]'
        } flex flex-col relative`} 
        style={isMobile ? { width: '100vw', height: '100vh' } : { width: '90vw', maxWidth: '90vw' }}
      >
        {/* Header - Hidden in fullscreen */}
        {!isFullscreen && (
          <DialogHeader className={isMobile ? "p-2" : ""}>
            <DialogTitle className={isMobile ? "text-sm" : ""}>
              Teleprompter - {telejornal?.nome || "Telejornal"}
            </DialogTitle>
          </DialogHeader>
        )}
        
        {/* Controls - Hidden in fullscreen */}
        {!isFullscreen && (
          <div className={`flex items-center gap-2 p-2 border-b bg-gray-50 ${
            isMobile ? 'flex-col space-y-2' : 'flex-wrap gap-4 p-4'
          }`}>
            <div className={`flex items-center gap-2 ${isMobile ? 'w-full justify-center' : ''}`}>
              <TeleprompterControls
                isPlaying={isPlaying}
                speed={speed}
                onPlayPause={handlePlayPause}
                onSpeedChange={handleSpeedChange}
                onReset={resetPosition}
                isMobile={isMobile}
              />
            </div>

            <div className={`flex items-center gap-2 ${isMobile ? 'w-full justify-center' : ''}`}>
              <TeleprompterViewControls
                fontSize={fontSize}
                onIncreaseFontSize={increaseFontSize}
                onDecreaseFontSize={decreaseFontSize}
                onFontSizeChange={handleFontSizeChange}
                isMobile={isMobile}
              />
            </div>

            {!isMobile && (
              <>
                <TeleprompterColorControls
                  cabecaColor={cabecaColor}
                  retrancaColor={retrancaColor}
                  tipoMaterialColor={tipoMaterialColor}
                  onCabecaColorChange={handleCabecaColorChange}
                  onRetrancaColorChange={handleRetrancaColorChange}
                  onTipoMaterialColorChange={handleTipoMaterialColorChange}
                />

                <TeleprompterExport
                  blocks={blocks}
                  telejornal={telejornal}
                />
              </>
            )}
          </div>
        )}

        {/* Teleprompter Content */}
        <div className="flex-1 overflow-hidden" style={{ width: '100%', maxWidth: '100%' }}>
          <TeleprompterContent
            ref={contentRef}
            blocks={blocks}
            fontSize={fontSize}
            cabecaColor={cabecaColor}
            retrancaColor={retrancaColor}
            tipoMaterialColor={tipoMaterialColor}
            isMobile={isMobile}
          />
        </div>

        {/* Mobile touch controls overlay */}
        {isMobile && !isFullscreen && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white p-2 rounded text-xs z-10 text-center">
            <div>Toque na tela: Play/Pause</div>
            <div>Deslize: Navegar</div>
          </div>
        )}

        {/* Desktop keyboard controls info overlay */}
        {!isMobile && !isFullscreen && (
          <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs z-10">
            <div>← → Navegar retrancas</div>
            <div>Espaço: Play/Pause</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
