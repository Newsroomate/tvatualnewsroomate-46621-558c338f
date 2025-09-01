
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Materia, Telejornal, Bloco } from "@/types";
import { TeleprompterControls } from "./teleprompter/TeleprompterControls";
import { TeleprompterViewControls } from "./teleprompter/TeleprompterViewControls";
import { TeleprompterColorControls } from "./teleprompter/TeleprompterColorControls";
import { TeleprompterExport } from "./teleprompter/TeleprompterExport";
import { TeleprompterContent } from "./teleprompter/TeleprompterContent";
import { useTeleprompterKeyboardControls } from "@/hooks/useTeleprompterKeyboardControls";

interface TeleprompterProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: (Bloco & { items: Materia[] })[];
  telejornal: Telejornal | null;
}

export const Teleprompter = ({ isOpen, onClose, blocks, telejornal }: TeleprompterProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState([50]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [fontSize, setFontSize] = useState(24);
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

  // Setup keyboard controls with scroll position sync
  useTeleprompterKeyboardControls({
    blocks,
    contentRef,
    isPlaying,
    onPlayPause: handlePlayPause,
    fontSize,
    setScrollPosition
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

  // Auto-scroll logic with smooth requestAnimationFrame
  useEffect(() => {
    const animate = (currentTime: number) => {
      const contentElement = contentRef.current;
      if (!contentElement || !isPlaying) return;

      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      // Calculate smooth scroll speed based on time elapsed
      const scrollSpeed = (speed[0] / 10) * (deltaTime / 16.67); // Normalize to 60fps
      
      const currentScrollTop = contentElement.scrollTop;
      const maxScroll = contentElement.scrollHeight - contentElement.clientHeight;
      
      const nextPosition = currentScrollTop + scrollSpeed;
      
      if (nextPosition >= maxScroll) {
        setIsPlaying(false);
        return;
      }
      
      // Update DOM directly for smooth scrolling
      contentElement.scrollTop = nextPosition;
      
      // Update scroll position state for persistence
      setScrollPosition(nextPosition);
      
      // Continue animation
      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    if (isPlaying && contentRef.current) {
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
  }, [isPlaying, speed]);

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
  }, [isPlaying]);

  // Apply scroll position only when not playing (to avoid conflicts during auto-scroll)
  useEffect(() => {
    if (!isPlaying && contentRef.current && scrollPosition > 0) {
      console.log('Applying scroll position:', scrollPosition);
      contentRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition, isPlaying]);

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
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col relative" style={{ width: '90vw', maxWidth: '90vw' }}>
        {/* Header - Hidden in fullscreen */}
        {!isFullscreen && (
          <DialogHeader>
            <DialogTitle>
              Teleprompter - {telejornal?.nome || "Telejornal"}
            </DialogTitle>
          </DialogHeader>
        )}
        
        {/* Controls - Hidden in fullscreen */}
        {!isFullscreen && (
          <div className="flex items-center gap-4 p-4 border-b bg-gray-50 flex-wrap">
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
          />
        </div>

        {/* Keyboard controls info overlay - only visible when not fullscreen */}
        {!isFullscreen && (
          <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs z-10">
            <div>← → Navegar retrancas</div>
            <div>Espaço: Play/Pause</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
