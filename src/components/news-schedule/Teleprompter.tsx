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
  const contentRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // Setup keyboard controls
  useTeleprompterKeyboardControls({
    blocks,
    contentRef,
    isPlaying,
    onPlayPause: handlePlayPause,
    fontSize
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

  useEffect(() => {
    if (isPlaying && contentRef.current) {
      const scrollSpeed = speed[0] / 10; // Convert speed to pixels per interval
      
      intervalRef.current = setInterval(() => {
        setScrollPosition(prev => {
          const newPosition = prev + scrollSpeed;
          const maxScroll = contentRef.current?.scrollHeight || 0;
          
          if (newPosition >= maxScroll) {
            setIsPlaying(false);
            return 0; // Reset to top when reaching end
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

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition]);

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
              onCabecaColorChange={handleCabecaColorChange}
              onRetrancaColorChange={handleRetrancaColorChange}
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
